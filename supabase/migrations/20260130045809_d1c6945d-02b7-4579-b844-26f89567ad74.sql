-- Add is_test_user column to profiles table
ALTER TABLE profiles 
ADD COLUMN is_test_user BOOLEAN NOT NULL DEFAULT FALSE;

-- Update get_leaderboard function to exclude test users
CREATE OR REPLACE FUNCTION public.get_leaderboard(p_sort_by text DEFAULT 'best'::text, p_limit integer DEFAULT 50)
 RETURNS TABLE(rank bigint, user_id uuid, username text, best_throws integer, avg_throws numeric, games_played bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Validate input parameters
  IF p_sort_by NOT IN ('best', 'average') THEN
    RAISE EXCEPTION 'Invalid sort_by parameter. Must be best or average.';
  END IF;
  
  IF p_limit < 1 OR p_limit > 100 THEN
    RAISE EXCEPTION 'Invalid limit parameter. Must be between 1 and 100.';
  END IF;

  IF p_sort_by = 'best' THEN
    RETURN QUERY
    SELECT 
      ROW_NUMBER() OVER (ORDER BY MIN(gr.throws_count) ASC) as rank,
      gr.user_id,
      COALESCE(p.username, 'Anonymous') as username,
      MIN(gr.throws_count) as best_throws,
      ROUND(AVG(gr.throws_count)::numeric, 1) as avg_throws,
      COUNT(*) as games_played
    FROM game_records gr
    LEFT JOIN profiles p ON gr.user_id = p.user_id
    WHERE gr.user_id IS NOT NULL
      AND (p.is_test_user IS NULL OR p.is_test_user = FALSE)
    GROUP BY gr.user_id, p.username
    ORDER BY best_throws ASC
    LIMIT p_limit;
  ELSE
    RETURN QUERY
    SELECT 
      ROW_NUMBER() OVER (ORDER BY AVG(gr.throws_count) ASC) as rank,
      gr.user_id,
      COALESCE(p.username, 'Anonymous') as username,
      MIN(gr.throws_count) as best_throws,
      ROUND(AVG(gr.throws_count)::numeric, 1) as avg_throws,
      COUNT(*) as games_played
    FROM game_records gr
    LEFT JOIN profiles p ON gr.user_id = p.user_id
    WHERE gr.user_id IS NOT NULL
      AND (p.is_test_user IS NULL OR p.is_test_user = FALSE)
    GROUP BY gr.user_id, p.username
    ORDER BY avg_throws ASC
    LIMIT p_limit;
  END IF;
END;
$function$;

-- Update get_player_rankings function to exclude test users from rankings and total count
CREATE OR REPLACE FUNCTION public.get_player_rankings(p_user_id uuid)
 RETURNS TABLE(rank_by_best integer, rank_by_average integer, total_players integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Ensure user can only query their own rankings
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: Can only query own rankings';
  END IF;
  
  RETURN QUERY
  WITH player_stats AS (
    SELECT 
      gr.user_id,
      MIN(gr.throws_count) as best_throw,
      AVG(gr.throws_count) as avg_throws
    FROM game_records gr
    LEFT JOIN profiles p ON gr.user_id = p.user_id
    WHERE gr.user_id IS NOT NULL
      AND (p.is_test_user IS NULL OR p.is_test_user = FALSE)
    GROUP BY gr.user_id
  ),
  ranked_by_best AS (
    SELECT ps.user_id, ROW_NUMBER() OVER (ORDER BY ps.best_throw ASC) as rank
    FROM player_stats ps
  ),
  ranked_by_avg AS (
    SELECT ps.user_id, ROW_NUMBER() OVER (ORDER BY ps.avg_throws ASC) as rank
    FROM player_stats ps
  )
  SELECT 
    rb.rank::integer as rank_by_best,
    ra.rank::integer as rank_by_average,
    (SELECT COUNT(*) FROM player_stats)::integer as total_players
  FROM ranked_by_best rb
  JOIN ranked_by_avg ra ON rb.user_id = ra.user_id
  WHERE rb.user_id = p_user_id;
END;
$function$;