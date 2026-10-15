-- Scenario tests for supabase/migrations/20261015120000_mokki_tech_tree.sql.
-- Run against a scratch database with all migrations applied (see supabase/tests/README.md).
-- Every block raises on failure.

BEGIN;

INSERT INTO auth.users (id) VALUES
  ('00000000-0000-0000-0000-0000000000a1'),
  ('00000000-0000-0000-0000-0000000000b1');
INSERT INTO profiles (user_id, username) VALUES
  ('00000000-0000-0000-0000-0000000000a1', 'Aino'),
  ('00000000-0000-0000-0000-0000000000b1', 'Juha');

-- 1. A chore can be logged once per day; neighbor actions once per day per target
DO $$
DECLARE v_failed BOOLEAN := false;
BEGIN
  INSERT INTO mokki_actions (user_id, action_id, action_date) VALUES ('00000000-0000-0000-0000-0000000000a1', 'onki', '2026-10-15');
  BEGIN
    INSERT INTO mokki_actions (user_id, action_id, action_date) VALUES ('00000000-0000-0000-0000-0000000000a1', 'onki', '2026-10-15');
  EXCEPTION WHEN unique_violation THEN v_failed := true;
  END;
  ASSERT v_failed, 'second chore on the same day must be rejected';
  -- Same chore tomorrow is fine
  INSERT INTO mokki_actions (user_id, action_id, action_date) VALUES ('00000000-0000-0000-0000-0000000000a1', 'onki', '2026-10-16');

  INSERT INTO mokki_actions (user_id, action_id, target_user_id, action_date)
  VALUES ('00000000-0000-0000-0000-0000000000a1', 'vessapaperi', '00000000-0000-0000-0000-0000000000b1', '2026-10-15');
  v_failed := false;
  BEGIN
    INSERT INTO mokki_actions (user_id, action_id, target_user_id, action_date)
    VALUES ('00000000-0000-0000-0000-0000000000a1', 'vessapaperi', '00000000-0000-0000-0000-0000000000b1', '2026-10-15');
  EXCEPTION WHEN unique_violation THEN v_failed := true;
  END;
  ASSERT v_failed, 'second prank on the same island on the same day must be rejected';

  v_failed := false;
  BEGIN
    INSERT INTO mokki_actions (user_id, action_id, target_user_id, action_date)
    VALUES ('00000000-0000-0000-0000-0000000000a1', 'kalalahja', '00000000-0000-0000-0000-0000000000a1', '2026-10-15');
  EXCEPTION WHEN check_violation THEN v_failed := true;
  END;
  ASSERT v_failed, 'actions on your own island must not have a target';
END $$;

-- 2. get_mokki_island lists today's palju guests and the peaceful flag
DO $$
DECLARE v JSONB;
BEGIN
  INSERT INTO mokki_actions (user_id, action_id, target_user_id, action_date)
  VALUES ('00000000-0000-0000-0000-0000000000b1', 'paljubileet', '00000000-0000-0000-0000-0000000000a1', (now() AT TIME ZONE 'Europe/Helsinki')::date);
  INSERT INTO user_settings (user_id, peaceful_mokki) VALUES ('00000000-0000-0000-0000-0000000000a1', true);
  v := get_mokki_island('00000000-0000-0000-0000-0000000000a1');
  ASSERT (v->>'peaceful')::boolean, format('peaceful: %s', v);
  ASSERT jsonb_array_length(v->'guests') = 1, format('guests: %s', v);
  ASSERT v->'guests'->0->>'username' = 'Juha', format('guest name: %s', v);
END $$;

-- 3. The owner empties their mailbox, nobody else's
DO $$
BEGIN
  INSERT INTO mokki_effects (target_user_id, from_user_id, action_id, visible_until)
  VALUES ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000b1', 'vessapaperi', now() + interval '24 hours'),
         ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a1', 'ruotsin_lippu', now() + interval '24 hours');
  PERFORM set_config('request.jwt.sub', '00000000-0000-0000-0000-0000000000a1', true);
  PERFORM mark_mokki_effects_seen();
  ASSERT (SELECT COUNT(*) FROM mokki_effects WHERE target_user_id = '00000000-0000-0000-0000-0000000000a1' AND seen_at IS NULL) = 0;
  ASSERT (SELECT COUNT(*) FROM mokki_effects WHERE target_user_id = '00000000-0000-0000-0000-0000000000b1' AND seen_at IS NULL) = 1;
END $$;

-- 4. Dog names are capped at 16 characters
DO $$
DECLARE v_failed BOOLEAN := false;
BEGIN
  INSERT INTO mokki_pieces (user_id, piece_id, price_paid, build_days, played_days_at_purchase, variant, nickname)
  VALUES ('00000000-0000-0000-0000-0000000000a1', 'koira', 700, 2, 0, 'lagotto', 'Pörrö');
  BEGIN
    UPDATE mokki_pieces SET nickname = repeat('x', 17) WHERE user_id = '00000000-0000-0000-0000-0000000000a1' AND piece_id = 'koira';
  EXCEPTION WHEN check_violation THEN v_failed := true;
  END;
  ASSERT v_failed, 'a 17-character dog name must be rejected';
END $$;

ROLLBACK;
