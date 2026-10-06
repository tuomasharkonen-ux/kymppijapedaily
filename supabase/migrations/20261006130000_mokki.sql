-- Mökki: owned cabin pieces, löyly greetings between friends, and read helpers
-- for visiting islands. Writes happen only via the buy-mokki-piece edge function
-- (service role) or the security definer functions below.

-- ---------------------------------------------------------------------------
-- Owned pieces
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.mokki_pieces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  piece_id TEXT NOT NULL,
  price_paid INTEGER NOT NULL CHECK (price_paid >= 0),
  build_days INTEGER NOT NULL CHECK (build_days >= 0),
  played_days_at_purchase INTEGER NOT NULL CHECK (played_days_at_purchase >= 0),
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT mokki_pieces_user_piece_unique UNIQUE (user_id, piece_id)
);

CREATE INDEX IF NOT EXISTS idx_mokki_pieces_user ON public.mokki_pieces(user_id);

ALTER TABLE public.mokki_pieces ENABLE ROW LEVEL SECURITY;

-- Islands are visitable: any signed-in player can see which pieces another owns
DROP POLICY IF EXISTS "Signed-in users can read mokki pieces" ON public.mokki_pieces;
CREATE POLICY "Signed-in users can read mokki pieces"
ON public.mokki_pieces
FOR SELECT
TO authenticated
USING (true);

-- No INSERT/UPDATE/DELETE policies: only the service role (edge function) writes.

-- ---------------------------------------------------------------------------
-- Löyly greetings (one per sender → recipient per Helsinki day)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.mokki_loylyt (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sent_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  seen_at TIMESTAMPTZ,
  CONSTRAINT mokki_loylyt_not_self CHECK (from_user_id <> to_user_id),
  CONSTRAINT mokki_loylyt_once_per_day UNIQUE (from_user_id, to_user_id, sent_date)
);

CREATE INDEX IF NOT EXISTS idx_mokki_loylyt_to_unseen ON public.mokki_loylyt(to_user_id) WHERE seen_at IS NULL;

ALTER TABLE public.mokki_loylyt ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own loylyt" ON public.mokki_loylyt;
CREATE POLICY "Users can read their own loylyt"
ON public.mokki_loylyt
FOR SELECT
TO authenticated
USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- ---------------------------------------------------------------------------
-- Read helpers (game_records and user_purchases are owner-only under RLS)
-- ---------------------------------------------------------------------------

-- Everything needed to render someone's island
CREATE OR REPLACE FUNCTION public.get_mokki_owner(p_user_id UUID)
RETURNS TABLE (
  username TEXT,
  owns_plot BOOLEAN,
  games_played INTEGER,
  played_today BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (SELECT p.username FROM profiles p WHERE p.user_id = p_user_id),
    EXISTS (SELECT 1 FROM user_purchases up WHERE up.user_id = p_user_id AND up.item_id = 'mokki_plot'),
    (SELECT COUNT(*)::INTEGER FROM game_records g WHERE g.user_id = p_user_id),
    EXISTS (
      SELECT 1 FROM game_records g
      WHERE g.user_id = p_user_id
        AND g.played_date = (now() AT TIME ZONE 'Europe/Helsinki')::date
    );
$$;

-- Who has a mökki (for "visit" links on the leaderboard)
CREATE OR REPLACE FUNCTION public.get_mokki_owners()
RETURNS TABLE (user_id UUID)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT up.user_id FROM user_purchases up WHERE up.item_id = 'mokki_plot';
$$;

-- Send löyly to a friend's mökki; returns false if already sent today
CREATE OR REPLACE FUNCTION public.send_mokki_loyly(p_to_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_from UUID := auth.uid();
  v_rows INTEGER;
BEGIN
  IF v_from IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF v_from = p_to_user_id THEN
    RAISE EXCEPTION 'You cannot send löyly to yourself';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM user_purchases WHERE user_id = p_to_user_id AND item_id = 'mokki_plot') THEN
    RAISE EXCEPTION 'That player has no mökki';
  END IF;

  INSERT INTO mokki_loylyt (from_user_id, to_user_id, sent_date)
  VALUES (v_from, p_to_user_id, (now() AT TIME ZONE 'Europe/Helsinki')::date)
  ON CONFLICT ON CONSTRAINT mokki_loylyt_once_per_day DO NOTHING;

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows > 0;
END;
$$;

-- Owner acknowledges received löyly (after the steam puff has played)
CREATE OR REPLACE FUNCTION public.mark_mokki_loylyt_seen()
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE mokki_loylyt SET seen_at = now()
  WHERE to_user_id = auth.uid() AND seen_at IS NULL;
$$;

REVOKE ALL ON FUNCTION public.get_mokki_owner(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_mokki_owners() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.send_mokki_loyly(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.mark_mokki_loylyt_seen() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_mokki_owner(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_mokki_owners() TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_mokki_loyly(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_mokki_loylyt_seen() TO authenticated;
