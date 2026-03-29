CREATE OR REPLACE FUNCTION public.get_player_rankings(p_user_id uuid)
RETURNS TABLE (
  rank_by_best integer,
  rank_by_average integer,
  total_players integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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