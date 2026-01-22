-- Drop the existing permissive INSERT policy
DROP POLICY IF EXISTS "Users can insert their own records" ON public.game_records;

-- Create a restrictive INSERT policy that blocks ALL client-side inserts
-- The edge function uses service role which bypasses RLS entirely
CREATE POLICY "Block direct client inserts" 
ON public.game_records 
FOR INSERT 
WITH CHECK (false);

-- Add a CHECK constraint to ensure played_date cannot be in the future
-- This is an additional safeguard even though the edge function controls the date
ALTER TABLE public.game_records 
ADD CONSTRAINT check_played_date_not_future 
CHECK (played_date <= CURRENT_DATE);