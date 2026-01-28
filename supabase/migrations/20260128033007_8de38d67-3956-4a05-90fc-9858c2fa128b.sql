-- Create user_purchases table
CREATE TABLE public.user_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  item_id TEXT NOT NULL,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_item UNIQUE(user_id, item_id)
);

-- Enable RLS
ALTER TABLE public.user_purchases ENABLE ROW LEVEL SECURITY;

-- Users can read their own purchases
CREATE POLICY "Users can read their own purchases"
ON public.user_purchases
FOR SELECT
USING (auth.uid() = user_id);

-- Block direct client inserts (only edge function can insert)
CREATE POLICY "Block direct client inserts"
ON public.user_purchases
FOR INSERT
WITH CHECK (false);

-- Create decrement_user_credits function
CREATE OR REPLACE FUNCTION public.decrement_user_credits(p_user_id UUID, p_amount INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_balance INTEGER;
BEGIN
  -- Validate amount is positive and reasonable
  IF p_amount <= 0 OR p_amount > 10000 THEN
    RAISE EXCEPTION 'Invalid credit amount: must be between 1 and 10000';
  END IF;
  
  -- Get current balance with row lock to prevent race conditions
  SELECT balance INTO v_current_balance
  FROM user_credits
  WHERE user_id = p_user_id
  FOR UPDATE;
  
  -- Check if user has credits record
  IF v_current_balance IS NULL THEN
    RAISE EXCEPTION 'User has no credits';
  END IF;
  
  -- Check if user has sufficient balance
  IF v_current_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient credits: have %, need %', v_current_balance, p_amount;
  END IF;
  
  -- Deduct credits
  UPDATE user_credits
  SET balance = balance - p_amount,
      updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Return new balance
  RETURN v_current_balance - p_amount;
END;
$$;