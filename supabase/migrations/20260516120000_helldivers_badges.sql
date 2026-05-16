-- Helldivers 2 stratagem badges
-- Unlocked only when completing kymppijape with the helldivers_dice skin active.
-- Six per-stratagem badges (matched to winning dice face 1-6), plus a meta badge
-- awarded after collecting all six stratagems.

INSERT INTO public.badges (id, name, description, trigger_type, trigger_value, prize_credits, rarity) VALUES
  ('helldivers_napalm',     'Scorched Earth',    'Complete Kymppijape with 1s using the Helldivers dice (Orbital Napalm Barrage)', 'helldivers_stratagem', '1', 50, 'Rare'),
  ('helldivers_bastion',    'Walking Fortress',  'Complete Kymppijape with 2s using the Helldivers dice (Bastion MK XVI)',         'helldivers_stratagem', '2', 50, 'Rare'),
  ('helldivers_autocannon', 'Hold the Line',     'Complete Kymppijape with 3s using the Helldivers dice (Autocannon Sentry)',     'helldivers_stratagem', '3', 50, 'Rare'),
  ('helldivers_hellbomb',   'Ground Zero',       'Complete Kymppijape with 4s using the Helldivers dice (Hellbomb)',              'helldivers_stratagem', '4', 50, 'Rare'),
  ('helldivers_eagle500',   'Eagle''s Wrath',    'Complete Kymppijape with 5s using the Helldivers dice (Eagle 500KG Bomb)',      'helldivers_stratagem', '5', 50, 'Rare'),
  ('helldivers_laser',      'Death From Above',  'Complete Kymppijape with 6s using the Helldivers dice (Orbital Laser)',         'helldivers_stratagem', '6', 50, 'Rare'),
  ('helldivers_master',     'For Super Earth!',  'Complete Kymppijape with all six Helldivers stratagems',                        'helldivers_all_stratagems', NULL, 500, 'Epic');
