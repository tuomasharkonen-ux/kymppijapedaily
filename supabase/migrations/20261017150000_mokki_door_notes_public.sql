-- Visitors can read the notes other players pinned on a door. A note stays on the door until the
-- owner reads it from their mailbox (seen_at), for at most 7 days. RLS on mokki_notes stays
-- sender/owner only; this function exposes just the pinned ones, without the caller's own.

CREATE OR REPLACE FUNCTION public.get_mokki_door_notes(p_user_id UUID)
RETURNS TABLE (id UUID, username TEXT, body TEXT, created_at TIMESTAMPTZ)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT n.id, p.username, n.body, n.created_at
  FROM mokki_notes n
  LEFT JOIN profiles p ON p.user_id = n.from_user_id
  WHERE auth.uid() IS NOT NULL
    AND n.to_user_id = p_user_id
    AND n.from_user_id <> auth.uid()
    AND n.seen_at IS NULL
    AND n.created_at > now() - interval '7 days'
  ORDER BY n.created_at DESC
  LIMIT 20;
$$;

REVOKE ALL ON FUNCTION public.get_mokki_door_notes(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_mokki_door_notes(UUID) TO authenticated;
