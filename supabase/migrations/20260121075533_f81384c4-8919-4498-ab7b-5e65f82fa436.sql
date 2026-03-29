-- Fix: Add input validation to get_leaderboard function
-- Validates p_sort_by parameter to only accept 'best' or 'average'
-- Validates p_limit parameter to be between 1 and 100

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
    GROUP BY gr.user_id, p.username
    ORDER BY avg_throws ASC
    LIMIT p_limit;
  END IF;
END;
$function$;