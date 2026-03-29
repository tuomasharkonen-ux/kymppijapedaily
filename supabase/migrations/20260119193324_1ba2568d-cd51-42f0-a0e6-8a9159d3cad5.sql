-- Fix #1: Remove the UPDATE policy on user_credits to prevent client-side credit manipulation
-- Credits should only be modified by the edge function using service role
DROP POLICY IF EXISTS "Users can update their own credits" ON public.user_credits;

-- Fix #2: Add database constraints to game_records for input validation
-- throws_count must be at least 1 (minimum possible) and reasonably capped
-- winning_number must be 1-6 for valid dice values
ALTER TABLE public.game_records 
ADD CONSTRAINT check_throws_count_valid 
  CHECK (throws_count >= 1 AND throws_count <= 10000);

ALTER TABLE public.game_records 
ADD CONSTRAINT check_winning_number_valid 
  CHECK (winning_number >= 1 AND winning_number <= 6);