-- Create badges table (reference table for all badge definitions)
CREATE TABLE public.badges (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  trigger_type TEXT NOT NULL,
  trigger_value TEXT,
  prize_credits INTEGER DEFAULT 0,
  rarity TEXT NOT NULL DEFAULT 'Common',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on badges (public read access)
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

-- Everyone can read badges (it's reference data)
CREATE POLICY "Anyone can read badges" 
ON public.badges 
FOR SELECT 
USING (true);

-- Create user_badges table (tracks earned badges per user)
CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  badge_id TEXT REFERENCES public.badges(id) ON DELETE CASCADE NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on user_badges
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- Users can read their own badges
CREATE POLICY "Users can read their own badges" 
ON public.user_badges 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can insert their own badges (will be called from edge function with service role)
CREATE POLICY "Users can insert their own badges" 
ON public.user_badges 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create user_credits table
CREATE TABLE public.user_credits (
  user_id UUID PRIMARY KEY,
  balance INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on user_credits
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

-- Users can read their own credits
CREATE POLICY "Users can read their own credits" 
ON public.user_credits 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can update their own credits
CREATE POLICY "Users can update their own credits" 
ON public.user_credits 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Users can insert their own credits record
CREATE POLICY "Users can insert their own credits" 
ON public.user_credits 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create function to update credits timestamp
CREATE OR REPLACE FUNCTION public.update_credits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for credits timestamp
CREATE TRIGGER update_user_credits_updated_at
BEFORE UPDATE ON public.user_credits
FOR EACH ROW
EXECUTE FUNCTION public.update_credits_updated_at();

-- Seed the badges table with all badge definitions
INSERT INTO public.badges (id, name, description, trigger_type, trigger_value, prize_credits, rarity) VALUES
-- Daily streak (repeatable)
('daily_streak', 'Keep on rollin''', 'Daily streak prize', 'streak_add', '1', 5, 'Common'),

-- First win
('first_win', 'Baby steps', 'Complete your first Kymppijape', 'win_game', 'TRUE', 10, 'Common'),

-- Winning number badges (1-6)
('win_1', 'Small but mighty', 'Get a Kymppijape with 1s', 'winning_number', '1', 20, 'Common'),
('win_2', 'Double trouble', 'Get a Kymppijape with 2s', 'winning_number', '2', 20, 'Common'),
('win_3', 'The Triple Threat', 'Get a Kymppijape with 3s', 'winning_number', '3', 20, 'Common'),
('win_4', 'May the fours be with you', 'Get a Kymppijape with 4s', 'winning_number', '4', 20, 'Common'),
('win_5', 'High five', 'Get a Kymppijape with 5s', 'winning_number', '5', 20, 'Common'),
('win_6', 'Devil''s hand', 'Get a Kymppijape with 6s', 'winning_number', '6', 20, 'Common'),

-- Streak milestones
('streak_10', '10 day streak!', 'Maintain a daily streak of 10 days', 'daily_streak', '10', 50, 'Uncommon'),
('streak_30', '1 month streak!', 'Maintain a daily streak of 30 days', 'daily_streak', '30', 50, 'Uncommon'),
('streak_50', '50 day streak!', 'Maintain a daily streak of 50 days', 'daily_streak', '50', 200, 'Rare'),
('streak_100', '100 day streak!', 'Maintain a daily streak of 100 days', 'daily_streak', '100', 500, 'Epic'),
('streak_365', 'A year of Kymppijape streak!', 'Maintain a daily streak of 365 days', 'daily_streak', '365', 1000, 'Legendary'),

-- Starter match badges
('starter_5', 'Half way there already!', 'Have 5 of the same number in your first throw', 'starter_match', '5', 20, 'Common'),
('starter_6', 'Awesome start', 'Have 6 of the same number in your first throw', 'starter_match', '6', 50, 'Uncommon'),
('starter_7', 'Incredible start', 'Have 7 of the same number in your first throw', 'starter_match', '7', 100, 'Rare'),
('starter_8', 'Epic start', 'Have 8 of the same number in your first throw', 'starter_match', '8', 300, 'Epic'),
('starter_9', 'Legendary start', 'Have 9 of the same number in your first throw', 'starter_match', '9', 500, 'Epic'),

-- Throw count badges
('throws_6', 'Dice Corporal', 'Get Kymppijape with 6 throws', 'winning_throw_count', '6', 20, 'Common'),
('throws_5', 'Dice Expert', 'Get Kymppijape with 5 throws', 'winning_throw_count', '5', 50, 'Uncommon'),
('throws_4', 'Dice Master', 'Get Kymppijape with 4 throws', 'winning_throw_count', '4', 75, 'Uncommon'),
('throws_3', 'Dice Grand Master', 'Get Kymppijape with 3 throws', 'winning_throw_count', '3', 150, 'Rare'),
('throws_2', 'Dice GOAT', 'Get Kymppijape with 2 throws', 'winning_throw_count', '2', 300, 'Epic'),
('throws_1', 'Dice God - one in 10 million!', 'Get Kymppijape with your first throw', 'winning_throw_count', '1', 1000, 'Legendary'),

-- Special badges
('special_share', 'Flexing', 'Use the share results -feature.', 'feature_used', 'TRUE', 10, 'Common'),
('special_straight', 'Dead straight', 'Lock in a straight (1-5) and reroll. But why?', 'locked_numbers', '1;2;3;4;5', 20, 'Common'),
('special_date_birthday', 'Happy birthday, Tuomas!', 'Complete Kymppijape on September 9th', 'date_match', '09-09', 50, 'Uncommon'),
('special_date_ny', 'Happy new year!', 'Complete Kymppijape on New Years Day', 'date_match', '01-01', 50, 'Uncommon'),
('special_date_xmas', 'Merry Christmas!', 'Complete Kymppijape on Christmas Day', 'date_match', '25-12', 50, 'Uncommon');