-- Raise prize credits for the repeatable daily streak, under par, and the
-- early streak milestones. check-achievements awards badge.prize_credits from
-- this table, so no function change is required. Other badges stay as seeded.

UPDATE public.badges AS b
SET prize_credits = v.prize_credits
FROM (
  VALUES
    ('daily_streak'::text, 25),  -- was 5
    ('under_par'::text, 50),     -- was 10
    ('streak_3'::text, 25),      -- was 15
    ('streak_7'::text, 50),      -- was 35
    ('streak_10'::text, 75),     -- was 50
    ('streak_30'::text, 100)     -- was 50
) AS v(id, prize_credits)
WHERE b.id = v.id;
