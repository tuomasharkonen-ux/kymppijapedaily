-- Fix 1: Block direct badge inserts (only edge functions with service role can insert)
DROP POLICY IF EXISTS "Users can insert their own badges" ON user_badges;

CREATE POLICY "Block direct client inserts" ON user_badges
  FOR INSERT WITH CHECK (false);

-- Fix 2: Block direct credit inserts (only increment_user_credits function can insert)
DROP POLICY IF EXISTS "Users can insert their own credits" ON user_credits;

CREATE POLICY "Block direct client inserts" ON user_credits
  FOR INSERT WITH CHECK (false);