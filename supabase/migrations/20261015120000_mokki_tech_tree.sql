-- Mökki Rakennuspuu: dog and flag choices, daily chores and neighbor actions,
-- prank marks + mailbox inbox, and peaceful mode. Existing mokki_pieces rows are
-- untouched: pieces bought before the tree stay owned (grandfathered).
-- Writes happen only via the buy-mokki-piece and mokki-action edge functions (service role).

-- ---------------------------------------------------------------------------
-- Piece variants: dog breed + name (koira), chosen flag (lipputanko)
-- ---------------------------------------------------------------------------
ALTER TABLE public.mokki_pieces ADD COLUMN IF NOT EXISTS variant TEXT;
ALTER TABLE public.mokki_pieces ADD COLUMN IF NOT EXISTS nickname TEXT;
ALTER TABLE public.mokki_pieces DROP CONSTRAINT IF EXISTS mokki_pieces_nickname_length;
ALTER TABLE public.mokki_pieces ADD CONSTRAINT mokki_pieces_nickname_length CHECK (nickname IS NULL OR char_length(nickname) <= 16);

-- Peaceful mökki: no pranks against you, and you can't prank anyone either
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS peaceful_mokki BOOLEAN NOT NULL DEFAULT false;

-- ---------------------------------------------------------------------------
-- Actions: one row per chore / prank / visit. Daily limits come from the unique index.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.mokki_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_id TEXT NOT NULL,
  target_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action_date DATE NOT NULL,
  reward INTEGER NOT NULL DEFAULT 0 CHECK (reward >= 0),
  target_reward INTEGER NOT NULL DEFAULT 0 CHECK (target_reward >= 0),
  foiled BOOLEAN NOT NULL DEFAULT false,
  label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT mokki_actions_not_self CHECK (target_user_id IS NULL OR target_user_id <> user_id)
);

-- Chores: once per day. Neighbor actions: once per day per target island.
CREATE UNIQUE INDEX IF NOT EXISTS mokki_actions_once_per_day
  ON public.mokki_actions (user_id, action_id, (COALESCE(target_user_id, user_id)), action_date);
CREATE INDEX IF NOT EXISTS idx_mokki_actions_target_day ON public.mokki_actions (target_user_id, action_date);

ALTER TABLE public.mokki_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read their own mokki actions" ON public.mokki_actions;
CREATE POLICY "Users read their own mokki actions"
ON public.mokki_actions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR auth.uid() = target_user_id);

-- ---------------------------------------------------------------------------
-- Effects: what happened to an island. Prank marks show until cleaned or expired;
-- every row is also a line in the owner's mailbox until seen.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.mokki_effects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_id TEXT NOT NULL,
  foiled BOOLEAN NOT NULL DEFAULT false,
  target_reward INTEGER NOT NULL DEFAULT 0,
  -- Prank mark visible on the island until then (NULL = mailbox only)
  visible_until TIMESTAMPTZ,
  cleared_at TIMESTAMPTZ,
  seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mokki_effects_target ON public.mokki_effects (target_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mokki_effects_unseen ON public.mokki_effects (target_user_id) WHERE seen_at IS NULL;

ALTER TABLE public.mokki_effects ENABLE ROW LEVEL SECURITY;

-- Islands are public, and so are the pranks on them
DROP POLICY IF EXISTS "Signed-in users can read mokki effects" ON public.mokki_effects;
CREATE POLICY "Signed-in users can read mokki effects"
ON public.mokki_effects
FOR SELECT
TO authenticated
USING (true);

-- ---------------------------------------------------------------------------
-- Read helpers
-- ---------------------------------------------------------------------------

-- Visiting info that's private under RLS: peaceful mode, test users, today's palju/grill guests
CREATE OR REPLACE FUNCTION public.get_mokki_island(p_user_id UUID)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'peaceful', COALESCE((SELECT us.peaceful_mokki FROM user_settings us WHERE us.user_id = p_user_id), false),
    'is_test_user', COALESCE((SELECT pr.is_test_user FROM profiles pr WHERE pr.user_id = p_user_id), false),
    'guests', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('action_id', a.action_id, 'user_id', a.user_id, 'username', COALESCE(pr.username, 'Player')) ORDER BY a.created_at)
      FROM mokki_actions a
      LEFT JOIN profiles pr ON pr.user_id = a.user_id
      WHERE a.target_user_id = p_user_id
        AND a.action_date = (now() AT TIME ZONE 'Europe/Helsinki')::date
        AND a.action_id IN ('paljubileet', 'grillibileet')
    ), '[]'::jsonb)
  );
$$;

-- Owner empties the mailbox
CREATE OR REPLACE FUNCTION public.mark_mokki_effects_seen()
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE mokki_effects SET seen_at = now()
  WHERE target_user_id = auth.uid() AND seen_at IS NULL;
$$;

REVOKE ALL ON FUNCTION public.get_mokki_island(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.mark_mokki_effects_seen() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_mokki_island(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_mokki_effects_seen() TO authenticated;
