-- Fix 1: Add DELETE policy to user_credits to prevent deletion
CREATE POLICY "Prevent credit deletion"
ON public.user_credits
FOR DELETE
USING (false);

-- Fix 2: Drop and recreate get_player_rankings with caller validation
DROP FUNCTION IF EXISTS public.get_player_rankings(uuid);

CREATE FUNCTION public.get_player_rankings(p_user_id uuid)
RETURNS TABLE(rank_by_best integer, rank_by_average integer, total_players integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Ensure user can only query their own rankings
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: Can only query own rankings';
  END IF;
  
  RETURN QUERY
  WITH player_stats AS (
    SELECT 
      user_id,
      MIN(throws_count) as best_throw,
      AVG(throws_count) as avg_throws
    FROM game_records
    WHERE user_id IS NOT NULL
    GROUP BY user_id
  ),
  ranked_by_best AS (
    SELECT user_id, ROW_NUMBER() OVER (ORDER BY best_throw ASC) as rank
    FROM player_stats
  ),
  ranked_by_avg AS (
    SELECT user_id, ROW_NUMBER() OVER (ORDER BY avg_throws ASC) as rank
    FROM player_stats
  )
  SELECT 
    rb.rank::integer as rank_by_best,
    ra.rank::integer as rank_by_average,
    (SELECT COUNT(DISTINCT user_id) FROM game_records WHERE user_id IS NOT NULL)::integer as total_players
  FROM ranked_by_best rb
  JOIN ranked_by_avg ra ON rb.user_id = ra.user_id
  WHERE rb.user_id = p_user_id;
END;
$$;

-- Fix 3: Recreate increment_user_credits with amount validation
CREATE OR REPLACE FUNCTION public.increment_user_credits(
  p_user_id UUID,
  p_amount INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate amount is positive and reasonable (max 10000 per call)
  IF p_amount <= 0 OR p_amount > 10000 THEN
    RAISE EXCEPTION 'Invalid credit amount: must be between 1 and 10000';
  END IF;
  
  INSERT INTO user_credits (user_id, balance)
  VALUES (p_user_id, p_amount)
  ON CONFLICT (user_id)
  DO UPDATE SET balance = user_credits.balance + p_amount,
                updated_at = now();
END;
$$;