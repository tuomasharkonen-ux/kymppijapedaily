
DROP FUNCTION IF EXISTS public.get_leaderboard(text, integer);

CREATE OR REPLACE FUNCTION public.get_leaderboard(p_sort_by text DEFAULT 'best'::text, p_limit integer DEFAULT 50)
 RETURNS TABLE(rank bigint, user_id uuid, username text, best_throws integer, avg_throws numeric, games_played bigint, current_streak bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF p_sort_by NOT IN ('best', 'average') THEN
    RAISE EXCEPTION 'Invalid sort_by parameter. Must be best or average.';
  END IF;
  
  IF p_limit < 1 OR p_limit > 100 THEN
    RAISE EXCEPTION 'Invalid limit parameter. Must be between 1 and 100.';
  END IF;

  IF p_sort_by = 'best' THEN
    RETURN QUERY
    WITH streaks AS (
      SELECT 
        sub.user_id as s_user_id,
        COUNT(*) as streak_count
      FROM (
        SELECT 
          gr2.user_id,
          gr2.played_date,
          gr2.played_date - (ROW_NUMBER() OVER (PARTITION BY gr2.user_id ORDER BY gr2.played_date DESC))::int AS grp
        FROM game_records gr2
        WHERE gr2.user_id IS NOT NULL
      ) sub
      WHERE sub.grp = (
        SELECT g2.played_date - 1::int
        FROM game_records g2
        WHERE g2.user_id = sub.user_id
        ORDER BY g2.played_date DESC
        LIMIT 1
      )
      GROUP BY sub.user_id
    )
    SELECT 
      ROW_NUMBER() OVER (ORDER BY MIN(gr.throws_count) ASC) as rank,
      gr.user_id,
      COALESCE(p.username, 'Anonymous') as username,
      MIN(gr.throws_count) as best_throws,
      ROUND(AVG(gr.throws_count)::numeric, 1) as avg_throws,
      COUNT(*) as games_played,
      COALESCE(s.streak_count, 0) as current_streak
    FROM game_records gr
    LEFT JOIN profiles p ON gr.user_id = p.user_id
    LEFT JOIN streaks s ON gr.user_id = s.s_user_id
    WHERE gr.user_id IS NOT NULL
      AND (p.is_test_user IS NULL OR p.is_test_user = FALSE)
    GROUP BY gr.user_id, p.username, s.streak_count
    ORDER BY best_throws ASC
    LIMIT p_limit;
  ELSE
    RETURN QUERY
    WITH streaks AS (
      SELECT 
        sub.user_id as s_user_id,
        COUNT(*) as streak_count
      FROM (
        SELECT 
          gr2.user_id,
          gr2.played_date,
          gr2.played_date - (ROW_NUMBER() OVER (PARTITION BY gr2.user_id ORDER BY gr2.played_date DESC))::int AS grp
        FROM game_records gr2
        WHERE gr2.user_id IS NOT NULL
      ) sub
      WHERE sub.grp = (
        SELECT g2.played_date - 1::int
        FROM game_records g2
        WHERE g2.user_id = sub.user_id
        ORDER BY g2.played_date DESC
        LIMIT 1
      )
      GROUP BY sub.user_id
    )
    SELECT 
      ROW_NUMBER() OVER (ORDER BY AVG(gr.throws_count) ASC) as rank,
      gr.user_id,
      COALESCE(p.username, 'Anonymous') as username,
      MIN(gr.throws_count) as best_throws,
      ROUND(AVG(gr.throws_count)::numeric, 1) as avg_throws,
      COUNT(*) as games_played,
      COALESCE(s.streak_count, 0) as current_streak
    FROM game_records gr
    LEFT JOIN profiles p ON gr.user_id = p.user_id
    LEFT JOIN streaks s ON gr.user_id = s.s_user_id
    WHERE gr.user_id IS NOT NULL
      AND (p.is_test_user IS NULL OR p.is_test_user = FALSE)
    GROUP BY gr.user_id, p.username, s.streak_count
    ORDER BY avg_throws ASC
    LIMIT p_limit;
  END IF;
END;
$function$;
