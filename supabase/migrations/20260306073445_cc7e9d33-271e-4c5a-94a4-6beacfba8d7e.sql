
CREATE TABLE public.game_throws (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  played_date date NOT NULL DEFAULT CURRENT_DATE,
  throw_number integer NOT NULL,
  dice_values integer[] NOT NULL,
  locked_indices integer[] NOT NULL DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, played_date, throw_number)
);

ALTER TABLE public.game_throws ENABLE ROW LEVEL SECURITY;

-- Users can read their own throws (for restoring game state on refresh)
CREATE POLICY "Users can read own throws"
  ON public.game_throws
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Block direct client inserts (must go through edge function)
CREATE POLICY "Block direct client inserts"
  ON public.game_throws
  FOR INSERT
  TO authenticated
  WITH CHECK (false);

-- Block client updates and deletes
CREATE POLICY "Block client updates"
  ON public.game_throws
  FOR UPDATE
  TO authenticated
  USING (false);

CREATE POLICY "Block client deletes"
  ON public.game_throws
  FOR DELETE
  TO authenticated
  USING (false);
