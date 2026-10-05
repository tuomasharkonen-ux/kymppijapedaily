-- Vedot (bets), Päivän Potti (daily pot) and Jackpot.
-- All credit movements happen in SECURITY DEFINER functions that only the
-- edge functions (service role) may execute.

-- ---------------------------------------------------------------------------
-- Security fix: credit functions must not be callable by clients.
-- They are SECURITY DEFINER and take an arbitrary user id, so any logged-in
-- user could otherwise mint credits or drain someone else's balance via RPC.
-- ---------------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.increment_user_credits(UUID, INTEGER) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.decrement_user_credits(UUID, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_user_credits(UUID, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.decrement_user_credits(UUID, INTEGER) TO service_role;

-- ---------------------------------------------------------------------------
-- Game day + game record extras
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.helsinki_today()
RETURNS date
LANGUAGE sql
STABLE
AS $$ SELECT (now() AT TIME ZONE 'Europe/Helsinki')::date $$;

ALTER TABLE public.game_records
  ADD COLUMN IF NOT EXISTS throw_log JSONB,
  ADD COLUMN IF NOT EXISTS unlocked_any BOOLEAN NOT NULL DEFAULT false;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.credit_ledger (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  delta INTEGER NOT NULL,
  reason TEXT NOT NULL,
  ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_credit_ledger_user ON public.credit_ledger(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  game_date DATE NOT NULL,
  bet_type TEXT NOT NULL CHECK (bet_type IN ('nopea', 'keskiarvo', 'ennatys')),
  tier TEXT CHECK (tier IN ('varma', 'rohkea', 'hullu')),
  lucky_number SMALLINT CHECK (lucky_number BETWEEN 1 AND 6),
  lukitut BOOLEAN NOT NULL DEFAULT false,
  max_throws INTEGER NOT NULL CHECK (max_throws >= 1),
  stake INTEGER NOT NULL CHECK (stake > 0),
  odds NUMERIC(8, 2) NOT NULL CHECK (odds >= 1),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'won', 'lost', 'void')),
  payout INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  settled_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_bets_user_date ON public.bets(user_id, game_date);

CREATE TABLE IF NOT EXISTS public.pots (
  game_date DATE PRIMARY KEY,
  buy_in INTEGER NOT NULL DEFAULT 50,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'settled', 'refunded')),
  total INTEGER NOT NULL DEFAULT 0,
  winner_ids UUID[] NOT NULL DEFAULT '{}',
  winning_throws INTEGER,
  prize_per_winner INTEGER NOT NULL DEFAULT 0,
  jackpot_cut INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  settled_at TIMESTAMPTZ
);

-- throws_count stays NULL until the pot is settled, so scores are hidden during the day
CREATE TABLE IF NOT EXISTS public.pot_entries (
  game_date DATE NOT NULL REFERENCES public.pots(game_date) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  throws_count INTEGER,
  payout INTEGER NOT NULL DEFAULT 0,
  reveal_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (game_date, user_id)
);

CREATE TABLE IF NOT EXISTS public.jackpot (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  balance INTEGER NOT NULL DEFAULT 200 CHECK (balance >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO public.jackpot (id, balance) VALUES (1, 200) ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.jackpot_wins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  game_date DATE NOT NULL,
  amount INTEGER NOT NULL,
  throws_count INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, game_date)
);

-- ---------------------------------------------------------------------------
-- RLS: clients read only; every write goes through the functions below
-- ---------------------------------------------------------------------------
ALTER TABLE public.credit_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pot_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jackpot ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jackpot_wins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own ledger" ON public.credit_ledger;
CREATE POLICY "Users read own ledger" ON public.credit_ledger
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users read own bets" ON public.bets;
CREATE POLICY "Users read own bets" ON public.bets
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Players read pots" ON public.pots;
CREATE POLICY "Players read pots" ON public.pots
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Players read pot entries" ON public.pot_entries;
CREATE POLICY "Players read pot entries" ON public.pot_entries
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Players read jackpot" ON public.jackpot;
CREATE POLICY "Players read jackpot" ON public.jackpot
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Players read jackpot wins" ON public.jackpot_wins;
CREATE POLICY "Players read jackpot wins" ON public.jackpot_wins
  FOR SELECT TO authenticated USING (true);

-- ---------------------------------------------------------------------------
-- Credit helper: change a balance and write the ledger in one step
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.vedot_apply_credit(
  p_user_id UUID,
  p_delta INTEGER,
  p_reason TEXT,
  p_ref TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance INTEGER;
BEGIN
  IF p_delta > 0 THEN
    INSERT INTO user_credits (user_id, balance)
    VALUES (p_user_id, p_delta)
    ON CONFLICT (user_id)
    DO UPDATE SET balance = user_credits.balance + p_delta, updated_at = now()
    RETURNING balance INTO v_balance;
  ELSIF p_delta < 0 THEN
    SELECT balance INTO v_balance FROM user_credits WHERE user_id = p_user_id FOR UPDATE;
    IF v_balance IS NULL OR v_balance < -p_delta THEN
      RAISE EXCEPTION 'Insufficient credits';
    END IF;
    UPDATE user_credits SET balance = balance + p_delta, updated_at = now()
    WHERE user_id = p_user_id
    RETURNING balance INTO v_balance;
  ELSE
    SELECT COALESCE(balance, 0) INTO v_balance FROM user_credits WHERE user_id = p_user_id;
    RETURN COALESCE(v_balance, 0);
  END IF;

  INSERT INTO credit_ledger (user_id, delta, reason, ref) VALUES (p_user_id, p_delta, p_reason, p_ref);
  RETURN v_balance;
END;
$$;

-- ---------------------------------------------------------------------------
-- Place the day's bets (already priced by the edge function) and/or join the pot.
-- p_bets: [{ type, tier, number, lukitut, maxThrows, stake, odds }]
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.place_daily_bets(
  p_user_id UUID,
  p_game_date DATE,
  p_bets JSONB,
  p_join_pot BOOLEAN,
  p_buy_in INTEGER
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total INTEGER;
  v_balance INTEGER;
BEGIN
  -- One placement per player per day
  PERFORM pg_advisory_xact_lock(hashtext('vedot_' || p_user_id::text || '_' || p_game_date::text));

  IF EXISTS (SELECT 1 FROM bets WHERE user_id = p_user_id AND game_date = p_game_date)
     OR EXISTS (SELECT 1 FROM pot_entries WHERE user_id = p_user_id AND game_date = p_game_date) THEN
    RAISE EXCEPTION 'Bets already placed today';
  END IF;

  IF EXISTS (SELECT 1 FROM game_records WHERE user_id = p_user_id AND played_date = p_game_date) THEN
    RAISE EXCEPTION 'Game already finished';
  END IF;

  SELECT COALESCE(SUM((b->>'stake')::INTEGER), 0) INTO v_total
  FROM jsonb_array_elements(COALESCE(p_bets, '[]'::jsonb)) AS b;

  IF p_join_pot THEN
    v_total := v_total + p_buy_in;
  END IF;

  IF v_total <= 0 THEN
    RAISE EXCEPTION 'Nothing to place';
  END IF;

  v_balance := vedot_apply_credit(p_user_id, -v_total, 'vedot_placed', p_game_date::text);

  INSERT INTO bets (user_id, game_date, bet_type, tier, lucky_number, lukitut, max_throws, stake, odds)
  SELECT
    p_user_id,
    p_game_date,
    b->>'type',
    b->>'tier',
    (b->>'number')::SMALLINT,
    COALESCE((b->>'lukitut')::BOOLEAN, false),
    (b->>'maxThrows')::INTEGER,
    (b->>'stake')::INTEGER,
    (b->>'odds')::NUMERIC
  FROM jsonb_array_elements(COALESCE(p_bets, '[]'::jsonb)) AS b;

  IF p_join_pot THEN
    INSERT INTO pots (game_date, buy_in) VALUES (p_game_date, p_buy_in)
    ON CONFLICT (game_date) DO NOTHING;

    PERFORM 1 FROM pots WHERE game_date = p_game_date AND status = 'open' FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Pot is closed';
    END IF;

    INSERT INTO pot_entries (game_date, user_id) VALUES (p_game_date, p_user_id);
    UPDATE pots SET total = total + p_buy_in WHERE game_date = p_game_date;
  END IF;

  RETURN v_balance;
END;
$$;

-- ---------------------------------------------------------------------------
-- Settle a player's open bets for a day.
-- p_results: [{ id, outcome }] where outcome is 'won' | 'lost' | 'void'.
-- Payouts are computed here from the stored stake and odds.
-- 5% of every lost stake feeds the jackpot.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.settle_user_bets(
  p_user_id UUID,
  p_game_date DATE,
  p_results JSONB
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
  v_stake INTEGER;
  v_payout INTEGER;
  v_total INTEGER := 0;
  v_to_jackpot INTEGER := 0;
BEGIN
  FOR r IN SELECT * FROM jsonb_to_recordset(p_results) AS x(id UUID, outcome TEXT) LOOP
    IF r.outcome NOT IN ('won', 'lost', 'void') THEN
      RAISE EXCEPTION 'Invalid outcome %', r.outcome;
    END IF;

    UPDATE bets
    SET status = r.outcome,
        payout = CASE
          WHEN r.outcome = 'won' THEN LEAST(FLOOR(stake * odds)::INTEGER, 10000)
          WHEN r.outcome = 'void' THEN stake
          ELSE 0
        END,
        settled_at = now()
    WHERE id = r.id AND user_id = p_user_id AND game_date = p_game_date AND status = 'open'
    RETURNING stake, payout INTO v_stake, v_payout;

    IF FOUND THEN
      v_total := v_total + v_payout;
      IF r.outcome = 'lost' THEN
        v_to_jackpot := v_to_jackpot + FLOOR(v_stake * 0.05)::INTEGER;
      END IF;
    END IF;
  END LOOP;

  IF v_total > 0 THEN
    PERFORM vedot_apply_credit(p_user_id, v_total, 'vedot_settled', p_game_date::text);
  END IF;

  IF v_to_jackpot > 0 THEN
    UPDATE jackpot SET balance = balance + v_to_jackpot, updated_at = now() WHERE id = 1;
  END IF;

  RETURN v_total;
END;
$$;

-- ---------------------------------------------------------------------------
-- Jackpot: win in <= 5 throws with a ticket (a bet or a pot entry that day).
-- Pays the whole jackpot immediately and reseeds it with 200.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.claim_jackpot(
  p_user_id UUID,
  p_game_date DATE,
  p_throws INTEGER
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_amount INTEGER;
BEGIN
  IF p_throws < 1 OR p_throws > 5 THEN
    RETURN 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM bets WHERE user_id = p_user_id AND game_date = p_game_date)
     AND NOT EXISTS (SELECT 1 FROM pot_entries WHERE user_id = p_user_id AND game_date = p_game_date) THEN
    RETURN 0;
  END IF;

  SELECT balance INTO v_amount FROM jackpot WHERE id = 1 FOR UPDATE;

  IF EXISTS (SELECT 1 FROM jackpot_wins WHERE user_id = p_user_id AND game_date = p_game_date) THEN
    RETURN 0;
  END IF;

  IF v_amount IS NULL OR v_amount <= 0 THEN
    RETURN 0;
  END IF;

  INSERT INTO jackpot_wins (user_id, game_date, amount, throws_count)
  VALUES (p_user_id, p_game_date, v_amount, p_throws);

  UPDATE jackpot SET balance = 200, updated_at = now() WHERE id = 1;

  PERFORM vedot_apply_credit(p_user_id, v_amount, 'jackpot', p_game_date::text);
  RETURN v_amount;
END;
$$;

-- ---------------------------------------------------------------------------
-- Settle every open pot from previous game days. Idempotent; safe to call often.
-- Rules: fewest throws wins, ties split, 10% (+ rounding remainder) to the
-- jackpot, a lone entrant is refunded, entrants who never finished forfeit.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.settle_due_pots()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pot RECORD;
  v_entry RECORD;
  v_entrants INTEGER;
  v_finished INTEGER;
  v_best INTEGER;
  v_winners UUID[];
  v_cut INTEGER;
  v_each INTEGER;
  v_rest INTEGER;
  v_count INTEGER := 0;
BEGIN
  FOR v_pot IN
    SELECT * FROM pots
    WHERE status = 'open' AND game_date < helsinki_today()
    ORDER BY game_date
    FOR UPDATE SKIP LOCKED
  LOOP
    UPDATE pot_entries pe
    SET throws_count = gr.throws_count
    FROM game_records gr
    WHERE pe.game_date = v_pot.game_date
      AND gr.user_id = pe.user_id
      AND gr.played_date = pe.game_date;

    SELECT COUNT(*), COUNT(throws_count) INTO v_entrants, v_finished
    FROM pot_entries WHERE game_date = v_pot.game_date;

    IF v_entrants <= 1 THEN
      FOR v_entry IN SELECT * FROM pot_entries WHERE game_date = v_pot.game_date LOOP
        UPDATE pot_entries SET payout = v_pot.buy_in
        WHERE game_date = v_pot.game_date AND user_id = v_entry.user_id;
        PERFORM vedot_apply_credit(v_entry.user_id, v_pot.buy_in, 'pot_refund', v_pot.game_date::text);
      END LOOP;
      UPDATE pots SET status = 'refunded', settled_at = now() WHERE game_date = v_pot.game_date;

    ELSIF v_finished = 0 THEN
      UPDATE jackpot SET balance = balance + v_pot.total, updated_at = now() WHERE id = 1;
      UPDATE pots SET status = 'settled', jackpot_cut = v_pot.total, settled_at = now()
      WHERE game_date = v_pot.game_date;

    ELSE
      SELECT MIN(throws_count) INTO v_best FROM pot_entries WHERE game_date = v_pot.game_date;
      SELECT ARRAY_AGG(user_id) INTO v_winners
      FROM pot_entries WHERE game_date = v_pot.game_date AND throws_count = v_best;

      v_cut := FLOOR(v_pot.total * 0.10)::INTEGER;
      v_each := FLOOR((v_pot.total - v_cut) / CARDINALITY(v_winners))::INTEGER;
      v_rest := v_pot.total - v_cut - v_each * CARDINALITY(v_winners);

      FOR i IN 1 .. CARDINALITY(v_winners) LOOP
        UPDATE pot_entries SET payout = v_each
        WHERE game_date = v_pot.game_date AND user_id = v_winners[i];
        PERFORM vedot_apply_credit(v_winners[i], v_each, 'pot_win', v_pot.game_date::text);
      END LOOP;

      UPDATE jackpot SET balance = balance + v_cut + v_rest, updated_at = now() WHERE id = 1;
      UPDATE pots
      SET status = 'settled',
          winner_ids = v_winners,
          winning_throws = v_best,
          prize_per_winner = v_each,
          jackpot_cut = v_cut + v_rest,
          settled_at = now()
      WHERE game_date = v_pot.game_date;
    END IF;

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

-- ---------------------------------------------------------------------------
-- Client-callable: mark yesterday's pot reveal as seen
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.mark_pot_reveal_seen(p_game_date DATE)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE pot_entries
  SET reveal_seen_at = now()
  WHERE user_id = auth.uid() AND game_date = p_game_date AND reveal_seen_at IS NULL;
$$;

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.vedot_apply_credit(UUID, INTEGER, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.place_daily_bets(UUID, DATE, JSONB, BOOLEAN, INTEGER) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.settle_user_bets(UUID, DATE, JSONB) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.claim_jackpot(UUID, DATE, INTEGER) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.settle_due_pots() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.mark_pot_reveal_seen(DATE) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.vedot_apply_credit(UUID, INTEGER, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.place_daily_bets(UUID, DATE, JSONB, BOOLEAN, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.settle_user_bets(UUID, DATE, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.claim_jackpot(UUID, DATE, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.settle_due_pots() TO service_role;
GRANT EXECUTE ON FUNCTION public.mark_pot_reveal_seen(DATE) TO authenticated;
