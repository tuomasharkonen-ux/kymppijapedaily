-- Owned features a player has switched off in Customization (e.g. betting_license, mokki_plot)
ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS hidden_features TEXT[] NOT NULL DEFAULT '{}';
