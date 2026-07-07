-- Suomen Sienet (mushroom skin) achievement badges
-- One badge per mushroom face + a master badge for collecting all six.
-- Awarded server-side in the check-achievements edge function when the player
-- owns the 'sieni_dice' skin and has won on the matching face.

INSERT INTO public.badges (id, name, description, trigger_type, trigger_value, prize_credits, rarity) VALUES
  ('sieni_win_kantarelli',      'Kultainen kantarelli', 'Win a Kymppijape on the Kantarelli face with the Suomen Sienet skin',        'sieni_win', '1', 30, 'Uncommon'),
  ('sieni_win_suppilovahvero',  'Syksyn sato',          'Win a Kymppijape on the Suppilovahvero face with the Suomen Sienet skin',    'sieni_win', '2', 30, 'Uncommon'),
  ('sieni_win_herkkutatti',     'Metsän kuningas',      'Win a Kymppijape on the Herkkutatti face with the Suomen Sienet skin',       'sieni_win', '3', 30, 'Uncommon'),
  ('sieni_win_korvasieni',      'Myrkyllinen herkku',   'Win a Kymppijape on the Korvasieni face with the Suomen Sienet skin',        'sieni_win', '4', 30, 'Uncommon'),
  ('sieni_win_mustatorvisieni', 'Varjojen torvi',       'Win a Kymppijape on the Mustatorvisieni face with the Suomen Sienet skin',   'sieni_win', '5', 30, 'Uncommon'),
  ('sieni_win_karpassieni',     'Punainen legenda',     'Win a Kymppijape on the Kärpässieni face with the Suomen Sienet skin',       'sieni_win', '6', 40, 'Rare'),
  ('sieni_master',              'Sienimestari',         'Collect every mushroom — win with all six faces of the Suomen Sienet skin', 'sieni_master', 'TRUE', 150, 'Epic')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  trigger_type = EXCLUDED.trigger_type,
  trigger_value = EXCLUDED.trigger_value,
  prize_credits = EXCLUDED.prize_credits,
  rarity = EXCLUDED.rarity;
