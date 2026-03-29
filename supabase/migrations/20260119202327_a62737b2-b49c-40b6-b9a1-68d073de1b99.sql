-- Create atomic increment function for user credits to prevent race conditions
CREATE OR REPLACE FUNCTION public.increment_user_credits(
  p_user_id UUID,
  p_amount INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO user_credits (user_id, balance)
  VALUES (p_user_id, p_amount)
  ON CONFLICT (user_id)
  DO UPDATE SET balance = user_credits.balance + p_amount,
                updated_at = now();
END;
$$;

-- Add unique constraint for one game per day per user
ALTER TABLE public.game_records 
ADD CONSTRAINT unique_user_played_date 
UNIQUE(user_id, played_date);