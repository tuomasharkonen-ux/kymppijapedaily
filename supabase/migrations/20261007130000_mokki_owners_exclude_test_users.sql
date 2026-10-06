-- Hide test users' mökkis from the neighbors list
CREATE OR REPLACE FUNCTION public.get_mokki_owners()
RETURNS TABLE (user_id UUID)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT up.user_id
  FROM user_purchases up
  LEFT JOIN profiles p ON p.user_id = up.user_id
  WHERE up.item_id = 'mokki_plot'
    AND (p.is_test_user IS NULL OR p.is_test_user = FALSE);
$$;
