
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
    WITH distinct_dates AS (
      SELECT DISTINCT gr2.user_id AS uid, gr2.played_date AS pd
      FROM game_records gr2
      WHERE gr2.user_id IS NOT NULL
    ),
    numbered AS (
      SELECT uid, pd,
        pd + (ROW_NUMBER() OVER (PARTITION BY uid ORDER BY pd DESC))::int AS grp
      FROM distinct_dates
    ),
    latest_grp AS (
      SELECT uid, grp, COUNT(*) AS streak_len, MAX(pd) AS max_date
      FROM numbered
      GROUP BY uid, grp
    ),
    best_streak AS (
      SELECT DISTINCT ON (uid) uid AS s_user_id,
        CASE WHEN max_date >= CURRENT_DATE - 1 THEN streak_len ELSE 0 END AS streak_count
      FROM latest_grp
      ORDER BY uid, max_date DESC
    )
    SELECT 
      ROW_NUMBER() OVER (ORDER BY MIN(gr.throws_count) ASC) as rank,
      gr.user_id,
      COALESCE(p.username, 'Anonymous') as username,
      MIN(gr.throws_count) as best_throws,
      ROUND(AVG(gr.throws_count)::numeric, 1) as avg_throws,
      COUNT(*) as games_played,
      COALESCE(bs.streak_count, 0) as current_streak
    FROM game_records gr
    LEFT JOIN profiles p ON gr.user_id = p.user_id
    LEFT JOIN best_streak bs ON gr.user_id = bs.s_user_id
    WHERE gr.user_id IS NOT NULL
      AND (p.is_test_user IS NULL OR p.is_test_user = FALSE)
    GROUP BY gr.user_id, p.username, bs.streak_count
    ORDER BY best_throws ASC
    LIMIT p_limit;
  ELSE
    RETURN QUERY
    WITH distinct_dates AS (
      SELECT DISTINCT gr2.user_id AS uid, gr2.played_date AS pd
      FROM game_records gr2
      WHERE gr2.user_id IS NOT NULL
    ),
    numbered AS (
      SELECT uid, pd,
        pd + (ROW_NUMBER() OVER (PARTITION BY uid ORDER BY pd DESC))::int AS grp
      FROM distinct_dates
    ),
    latest_grp AS (
      SELECT uid, grp, COUNT(*) AS streak_len, MAX(pd) AS max_date
      FROM numbered
      GROUP BY uid, grp
    ),
    best_streak AS (
      SELECT DISTINCT ON (uid) uid AS s_user_id,
        CASE WHEN max_date >= CURRENT_DATE - 1 THEN streak_len ELSE 0 END AS streak_count
      FROM latest_grp
      ORDER BY uid, max_date DESC
    )
    SELECT 
      ROW_NUMBER() OVER (ORDER BY AVG(gr.throws_count) ASC) as rank,
      gr.user_id,
      COALESCE(p.username, 'Anonymous') as username,
      MIN(gr.throws_count) as best_throws,
      ROUND(AVG(gr.throws_count)::numeric, 1) as avg_throws,
      COUNT(*) as games_played,
      COALESCE(bs.streak_count, 0) as current_streak
    FROM game_records gr
    LEFT JOIN profiles p ON gr.user_id = p.user_id
    LEFT JOIN best_streak bs ON gr.user_id = bs.s_user_id
    WHERE gr.user_id IS NOT NULL
      AND (p.is_test_user IS NULL OR p.is_test_user = FALSE)
    GROUP BY gr.user_id, p.username, bs.streak_count
    ORDER BY avg_throws ASC
    LIMIT p_limit;
  END IF;
END;
$function$;
