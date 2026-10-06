-- Scenario tests for supabase/migrations/20261006120000_vedot_potti_jackpot.sql.
-- Run against a scratch database with all migrations applied (see supabase/tests/README.md).
-- Every block raises on failure.

BEGIN;

INSERT INTO auth.users (id) VALUES
  ('00000000-0000-0000-0000-00000000000a'),
  ('00000000-0000-0000-0000-00000000000b'),
  ('00000000-0000-0000-0000-00000000000c'),
  ('00000000-0000-0000-0000-00000000000d');
INSERT INTO user_credits (user_id, balance) VALUES
  ('00000000-0000-0000-0000-00000000000a', 1000),
  ('00000000-0000-0000-0000-00000000000b', 1000),
  ('00000000-0000-0000-0000-00000000000c', 60),
  ('00000000-0000-0000-0000-00000000000d', 1000);

-- 1. Placing bets debits stake + buy-in once; a second placement is rejected
DO $$
DECLARE v_balance INTEGER; v_failed BOOLEAN := false;
BEGIN
  v_balance := place_daily_bets('00000000-0000-0000-0000-00000000000a', helsinki_today(),
    '[{"type":"nopea","tier":"rohkea","lukitut":false,"maxThrows":9,"stake":50,"odds":4.3},
      {"type":"nopea","tier":"hullu","lukitut":true,"maxThrows":6,"stake":100,"odds":40}]'::jsonb,
    true, 50);
  ASSERT v_balance = 800, format('balance after placing: %s', v_balance);
  ASSERT (SELECT COUNT(*) FROM bets WHERE user_id = '00000000-0000-0000-0000-00000000000a') = 2;
  ASSERT (SELECT total FROM pots WHERE game_date = helsinki_today()) = 50;
  BEGIN
    PERFORM place_daily_bets('00000000-0000-0000-0000-00000000000a', helsinki_today(), '[]'::jsonb, true, 50);
  EXCEPTION WHEN OTHERS THEN v_failed := SQLERRM LIKE '%already placed%';
  END;
  ASSERT v_failed, 'second placement must fail';
END $$;

-- 2. Insufficient credits rolls back everything
DO $$
DECLARE v_failed BOOLEAN := false;
BEGIN
  BEGIN
    PERFORM place_daily_bets('00000000-0000-0000-0000-00000000000c', helsinki_today(),
      '[{"type":"nopea","tier":"varma","maxThrows":13,"stake":50,"odds":1.8}]'::jsonb, true, 50);
  EXCEPTION WHEN OTHERS THEN v_failed := SQLERRM LIKE '%Insufficient%';
  END;
  ASSERT v_failed, 'overspending must fail';
  ASSERT (SELECT balance FROM user_credits WHERE user_id = '00000000-0000-0000-0000-00000000000c') = 60;
  ASSERT NOT EXISTS (SELECT 1 FROM bets WHERE user_id = '00000000-0000-0000-0000-00000000000c');
END $$;

-- 3. Settlement pays won bets from stored odds, 5% of lost stakes go to the jackpot, idempotent
DO $$
DECLARE v_won UUID; v_lost UUID; v_paid INTEGER;
BEGIN
  SELECT id INTO v_won FROM bets WHERE user_id = '00000000-0000-0000-0000-00000000000a' AND tier = 'rohkea';
  SELECT id INTO v_lost FROM bets WHERE user_id = '00000000-0000-0000-0000-00000000000a' AND tier = 'hullu';
  v_paid := settle_user_bets('00000000-0000-0000-0000-00000000000a', helsinki_today(),
    jsonb_build_array(jsonb_build_object('id', v_won, 'outcome', 'won'), jsonb_build_object('id', v_lost, 'outcome', 'lost')));
  ASSERT v_paid = 215, format('payout %s', v_paid);
  ASSERT (SELECT balance FROM user_credits WHERE user_id = '00000000-0000-0000-0000-00000000000a') = 1015;
  ASSERT (SELECT balance FROM jackpot) = 205;
  v_paid := settle_user_bets('00000000-0000-0000-0000-00000000000a', helsinki_today(),
    jsonb_build_array(jsonb_build_object('id', v_won, 'outcome', 'won')));
  ASSERT v_paid = 0, 'settling twice must not pay twice';
  ASSERT (SELECT COUNT(*) FROM credit_ledger WHERE user_id = '00000000-0000-0000-0000-00000000000a') = 2;
END $$;

-- 4. Jackpot: needs a ticket and <= 5 throws, pays once, reseeds at 200
DO $$
BEGIN
  ASSERT claim_jackpot('00000000-0000-0000-0000-00000000000b', helsinki_today(), 3) = 0, 'no ticket, no jackpot';
  ASSERT claim_jackpot('00000000-0000-0000-0000-00000000000a', helsinki_today(), 6) = 0, '6 throws is too many';
  ASSERT claim_jackpot('00000000-0000-0000-0000-00000000000a', helsinki_today(), 5) = 205;
  ASSERT claim_jackpot('00000000-0000-0000-0000-00000000000a', helsinki_today(), 5) = 0, 'only once per day';
  ASSERT (SELECT balance FROM jackpot) = 200;
  ASSERT (SELECT balance FROM user_credits WHERE user_id = '00000000-0000-0000-0000-00000000000a') = 1220;
END $$;

-- 5. Yesterday's pot: tie splits, non-finisher forfeits, 10% + remainder to jackpot
DO $$
DECLARE v_day DATE := helsinki_today() - 1;
BEGIN
  PERFORM place_daily_bets('00000000-0000-0000-0000-00000000000a', v_day, '[]'::jsonb, true, 50);
  PERFORM place_daily_bets('00000000-0000-0000-0000-00000000000b', v_day, '[]'::jsonb, true, 50);
  PERFORM place_daily_bets('00000000-0000-0000-0000-00000000000d', v_day, '[]'::jsonb, true, 50);
  INSERT INTO game_records (user_id, throws_count, winning_number, played_date) VALUES
    ('00000000-0000-0000-0000-00000000000a', 8, 3, v_day),
    ('00000000-0000-0000-0000-00000000000b', 8, 5, v_day);
  ASSERT settle_due_pots() = 1;
  ASSERT (SELECT status FROM pots WHERE game_date = v_day) = 'settled';
  ASSERT (SELECT winning_throws FROM pots WHERE game_date = v_day) = 8;
  ASSERT (SELECT prize_per_winner FROM pots WHERE game_date = v_day) = 67;
  ASSERT (SELECT jackpot_cut FROM pots WHERE game_date = v_day) = 16;
  ASSERT (SELECT balance FROM jackpot) = 216;
  ASSERT (SELECT balance FROM user_credits WHERE user_id = '00000000-0000-0000-0000-00000000000b') = 1017;
  ASSERT (SELECT balance FROM user_credits WHERE user_id = '00000000-0000-0000-0000-00000000000d') = 950;
  ASSERT (SELECT throws_count FROM pot_entries WHERE game_date = v_day AND user_id = '00000000-0000-0000-0000-00000000000d') IS NULL;
  ASSERT settle_due_pots() = 0, 'settlement is idempotent';
  ASSERT (SELECT status FROM pots WHERE game_date = helsinki_today()) = 'open', 'today''s pot stays open';
END $$;

-- 6. A lone entrant is refunded
DO $$
DECLARE v_day DATE := helsinki_today() - 2;
BEGIN
  PERFORM place_daily_bets('00000000-0000-0000-0000-00000000000d', v_day, '[]'::jsonb, true, 50);
  ASSERT settle_due_pots() = 1;
  ASSERT (SELECT status FROM pots WHERE game_date = v_day) = 'refunded';
  ASSERT (SELECT balance FROM user_credits WHERE user_id = '00000000-0000-0000-0000-00000000000d') = 950;
END $$;

-- 7. Clients cannot call credit functions; they can mark their own reveal as seen; RLS hides others' bets
GRANT USAGE ON SCHEMA public, auth TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
SET LOCAL request.jwt.sub = '00000000-0000-0000-0000-00000000000b';
SET LOCAL ROLE authenticated;
DO $$
DECLARE v_denied INTEGER := 0;
BEGIN
  BEGIN PERFORM increment_user_credits('00000000-0000-0000-0000-00000000000b', 5000);
  EXCEPTION WHEN insufficient_privilege THEN v_denied := v_denied + 1; END;
  BEGIN PERFORM decrement_user_credits('00000000-0000-0000-0000-00000000000a', 100);
  EXCEPTION WHEN insufficient_privilege THEN v_denied := v_denied + 1; END;
  BEGIN PERFORM vedot_apply_credit('00000000-0000-0000-0000-00000000000b', 5000, 'x', 'x');
  EXCEPTION WHEN insufficient_privilege THEN v_denied := v_denied + 1; END;
  BEGIN PERFORM settle_due_pots();
  EXCEPTION WHEN insufficient_privilege THEN v_denied := v_denied + 1; END;
  ASSERT v_denied = 4, format('only %s of 4 calls denied', v_denied);

  PERFORM mark_pot_reveal_seen(helsinki_today() - 1);
  ASSERT (SELECT COUNT(*) FROM bets) = 0, 'B has no bets and must not see A''s';
  ASSERT (SELECT COUNT(*) FROM pot_entries WHERE reveal_seen_at IS NOT NULL) = 1;
END $$;
RESET ROLE;

ROLLBACK;
SELECT 'vedot_potti_jackpot tests passed' AS result;
