-- Create profiles table
CREATE TABLE public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add unique constraint for usernames (case-insensitive)
CREATE UNIQUE INDEX profiles_username_unique ON profiles (LOWER(username));

-- Add check constraint for username format (3-20 chars, alphanumeric + underscores)
ALTER TABLE profiles ADD CONSTRAINT username_format 
  CHECK (username ~ '^[a-zA-Z0-9_]{3,20}$');

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read all profiles (needed for leaderboard)
CREATE POLICY "Anyone can read profiles" ON profiles
  FOR SELECT USING (true);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own profile
CREATE POLICY "Users can delete own profile" ON profiles
  FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_credits_updated_at();

-- Create leaderboard database function
CREATE OR REPLACE FUNCTION public.get_leaderboard(
  p_sort_by TEXT DEFAULT 'best',
  p_limit INT DEFAULT 50
)
RETURNS TABLE(
  rank BIGINT,
  user_id UUID,
  username TEXT,
  best_throws INT,
  avg_throws NUMERIC,
  games_played BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
$$;