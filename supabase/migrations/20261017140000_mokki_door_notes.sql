-- Mökki door notes: visitors leave a short hello on a neighbor's (closed) cabin door in walk mode.
-- The owner finds them in the porch mailbox. Writes go through leave_mokki_note() only.

CREATE TABLE IF NOT EXISTS public.mokki_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  seen_at TIMESTAMPTZ,
  CONSTRAINT mokki_notes_not_self CHECK (from_user_id <> to_user_id),
  CONSTRAINT mokki_notes_body_length CHECK (char_length(body) BETWEEN 1 AND 140)
);

CREATE INDEX IF NOT EXISTS idx_mokki_notes_to_unseen ON public.mokki_notes(to_user_id) WHERE seen_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_mokki_notes_from_to ON public.mokki_notes(from_user_id, to_user_id, created_at DESC);

ALTER TABLE public.mokki_notes ENABLE ROW LEVEL SECURITY;

-- Senders see what they left, owners see what they got. No direct inserts/updates.
DROP POLICY IF EXISTS "Users can read their own notes" ON public.mokki_notes;
CREATE POLICY "Users can read their own notes"
ON public.mokki_notes
FOR SELECT
TO authenticated
USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- Leave a note on someone's door: 1–140 characters, at most 3 per door per day
CREATE OR REPLACE FUNCTION public.leave_mokki_note(p_to_user_id UUID, p_body TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_from UUID := auth.uid();
  v_body TEXT := btrim(regexp_replace(coalesce(p_body, ''), '\s+', ' ', 'g'));
  v_today INTEGER;
  v_id UUID;
BEGIN
  IF v_from IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF v_from = p_to_user_id THEN
    RAISE EXCEPTION 'You cannot leave a note on your own door';
  END IF;
  IF char_length(v_body) = 0 OR char_length(v_body) > 140 THEN
    RAISE EXCEPTION 'Notes are 1–140 characters';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM user_purchases WHERE user_id = p_to_user_id AND item_id = 'mokki_plot') THEN
    RAISE EXCEPTION 'That player has no mökki';
  END IF;

  SELECT COUNT(*) INTO v_today
  FROM mokki_notes
  WHERE from_user_id = v_from
    AND to_user_id = p_to_user_id
    AND (created_at AT TIME ZONE 'Europe/Helsinki')::date = (now() AT TIME ZONE 'Europe/Helsinki')::date;
  IF v_today >= 3 THEN
    RAISE EXCEPTION 'The notepad is full for today (3 notes per door)';
  END IF;

  INSERT INTO mokki_notes (from_user_id, to_user_id, body)
  VALUES (v_from, p_to_user_id, v_body)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- Owner read their notes (closing the mailbox)
CREATE OR REPLACE FUNCTION public.mark_mokki_notes_seen()
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE mokki_notes SET seen_at = now()
  WHERE to_user_id = auth.uid() AND seen_at IS NULL;
$$;

REVOKE ALL ON FUNCTION public.leave_mokki_note(UUID, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.mark_mokki_notes_seen() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.leave_mokki_note(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_mokki_notes_seen() TO authenticated;
