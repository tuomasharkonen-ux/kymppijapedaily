-- Add active_throw_animation column to user_settings
ALTER TABLE public.user_settings 
ADD COLUMN active_throw_animation TEXT DEFAULT NULL;