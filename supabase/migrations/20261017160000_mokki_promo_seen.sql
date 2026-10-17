-- One-time Mökki promo. Set when the player dismisses the carousel or follows the CTA.
-- Apply this in the Lovable SQL editor on the live project (same as earlier mökki migrations).
ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS mokki_promo_seen_at TIMESTAMPTZ;
