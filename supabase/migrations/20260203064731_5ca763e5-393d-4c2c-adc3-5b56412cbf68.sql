-- =====================================================
-- NEW BADGES: Social, Shop, Consistency, Performance, Holidays, Milestones, Streaks
-- =====================================================

-- SOCIAL BADGES
INSERT INTO public.badges (id, name, description, trigger_type, trigger_value, prize_credits, rarity)
VALUES 
  ('share_5', 'Social Butterfly', 'Share your results 5 times', 'share_count', '5', 25, 'Uncommon'),
  ('share_10', 'Influencer', 'Share your results 10 times', 'share_count', '10', 50, 'Rare');

-- SHOP BADGES
INSERT INTO public.badges (id, name, description, trigger_type, trigger_value, prize_credits, rarity)
VALUES 
  ('first_purchase', 'First Purchase', 'Make your first shop purchase', 'first_purchase', NULL, 25, 'Common'),
  ('skin_collector_3', 'Skin Collector', 'Own 3 different dice skins', 'skin_collection', '3', 50, 'Uncommon'),
  ('skin_collector_5', 'Dice Fashionista', 'Own 5 different dice skins', 'skin_collection', '5', 100, 'Rare');

-- REPETITION & CONSISTENCY BADGES
INSERT INTO public.badges (id, name, description, trigger_type, trigger_value, prize_credits, rarity)
VALUES 
  ('groundhog_day', 'Groundhog Day', 'Win with the same number 3 days in a row', 'repeat_win', '3', 75, 'Rare'),
  ('lucky_number', 'Lucky Number', 'Win with the same number 5 times total', 'win_count_same', '5', 50, 'Uncommon'),
  ('master_of_one', 'Master of One', 'Win with the same number 10 times total', 'win_count_same', '10', 100, 'Rare');

-- PERFORMANCE BADGES
INSERT INTO public.badges (id, name, description, trigger_type, trigger_value, prize_credits, rarity)
VALUES 
  ('under_par', 'Under Par', 'Beat your personal average in a game', 'under_par', NULL, 10, 'Common'),
  ('personal_record', 'New Personal Best!', 'Set a new personal best score', 'personal_best', NULL, 50, 'Uncommon');

-- HOLIDAY & SPECIAL DATE BADGES
INSERT INTO public.badges (id, name, description, trigger_type, trigger_value, prize_credits, rarity)
VALUES 
  ('special_date_valentine', 'Love Dice', 'Play on Valentine''s Day', 'date_match', '02-14', 50, 'Rare'),
  ('special_date_stpatrick', 'Lucky Charm', 'Play on St. Patrick''s Day', 'date_match', '03-17', 50, 'Rare'),
  ('special_date_halloween', 'Spooky Roller', 'Play on Halloween', 'date_match', '10-31', 50, 'Rare'),
  ('special_date_friday13', 'Fearless', 'Play on Friday the 13th', 'date_match', 'friday_13', 75, 'Epic'),
  ('special_date_leap', 'Leap Year Lucky', 'Play on February 29th', 'date_match', '02-29', 150, 'Legendary'),
  ('special_date_summer', 'Summer Solstice', 'Play on June 21st', 'date_match', '06-21', 50, 'Rare'),
  ('special_date_winter', 'Winter Solstice', 'Play on December 21st', 'date_match', '12-21', 50, 'Rare');

-- MILESTONE BADGES (games played)
INSERT INTO public.badges (id, name, description, trigger_type, trigger_value, prize_credits, rarity)
VALUES 
  ('games_10', 'Getting Started', 'Play 10 games', 'total_games', '10', 25, 'Common'),
  ('games_50', 'Regular Player', 'Play 50 games', 'total_games', '50', 50, 'Uncommon'),
  ('games_100', 'Century Club', 'Play 100 games', 'total_games', '100', 100, 'Rare'),
  ('games_365', 'Year of Dice', 'Play 365 games', 'total_games', '365', 250, 'Epic'),
  ('games_1000', 'Dice Master', 'Play 1000 games', 'total_games', '1000', 500, 'Legendary');

-- STREAK GAP FILLER BADGES
INSERT INTO public.badges (id, name, description, trigger_type, trigger_value, prize_credits, rarity)
VALUES 
  ('streak_3', 'Three-Peat', 'Maintain a 3-day streak', 'daily_streak', '3', 15, 'Common'),
  ('streak_7', 'Weekly Warrior', 'Maintain a 7-day streak', 'daily_streak', '7', 35, 'Uncommon'),
  ('streak_200', 'Unstoppable', 'Maintain a 200-day streak', 'daily_streak', '200', 400, 'Legendary');

-- STARTER BADGE: 10 matching dice (extremely rare)
INSERT INTO public.badges (id, name, description, trigger_type, trigger_value, prize_credits, rarity)
VALUES 
  ('starter_10', 'Perfect Start', 'Get all 10 dice matching on first throw', 'starter_match', '10', 2000, 'Legendary');