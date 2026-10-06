# Deploying Bets, Pot of the Day, Jackpot & Mökki

Branch: `feature/vedot-potti-mokki` (not pushed). Plan: `docs/plans/2026-10-06-vedot-potti-jackpot.md`.

Nothing here has run against the real Supabase project yet. The SQL was run against a local Postgres, the edge functions were type-checked, and the UI was tested in a headless browser with mock data.

## 1. Apply the migrations (Lovable SQL editor, project `sbnojaeuhjufjbljokgl`)

Run in this order, each file in full:

1. `supabase/migrations/20261006120000_vedot_potti_jackpot.sql`
   - Tables: bets, pots, pot_entries, jackpot (seeded with 200), jackpot_wins, credit_ledger
   - New `game_records` columns: `throw_log`, `unlocked_any`
   - Transactional money functions, plus 4 new badges
   - **Security fix:** revokes client access to `increment_user_credits` and `decrement_user_credits`. Until now any logged-in user could probably call them over RPC to add credits to themselves or drain someone else's balance. Only the edge functions (service role) use them, so nothing in the app breaks.
2. `supabase/migrations/20261006130000_mokki.sql`
   - Tables: mokki_pieces, mokki_loylyt, plus four RPCs

## 2. Deploy the edge functions

New:
- `get-daily-board`
- `place-bets`
- `buy-mokki-piece`

Changed (redeploy):
- `save-game-result` (Helsinki date, throw log, settles bets and the jackpot)
- `check-achievements` (Helsinki date, shared opening, Vedot badges)
- `purchase-item` (new shop items Betting License `betting_license` 300 cr and Mökkitontti `mokki_plot` 1000 cr)

All of them import from `supabase/functions/_shared/`, which must be deployed alongside them.

`supabase/config.toml` already contains `verify_jwt = false` for the new functions, matching the existing ones.

## 3. Smoke test after deploying

- [ ] The game still works for a player without the licence: same opening for two accounts, random throws after that, refreshing mid-game continues the game.
- [ ] Buy the Betting License → throw the opening → the sheet appears → place a bet and join the pot → LOCKED IN stamp → tracker shows the bets → win → Results screen shows the right payout and the balance updates.
- [ ] Second account joins the same pot. The next day (after Helsinki midnight) both see Yesterday's Pot, and the winner's balance went up.
- [ ] Buy Mökkitontti → the home screen shows the island → buy a piece → it shows scaffolding until enough days are played.
- [ ] `credit_ledger` has a row for every bet, payout and pot movement.

## 4. Things to know

- **Deploy day.** Games started before the deploy used the old per-player opening. If such a player had bets, the throw log won't match the new shared opening, so their bets are voided and refunded automatically.
- **Cached old clients.** An old client doesn't send a throw log, so the same void-and-refund applies. Only licence owners are affected.
- **Game day is Helsinki time** everywhere now. Before this, the server used the UTC date, so playing between 00:00 and 03:00 Finnish time was saved under the previous day.
- **Starter badges get shared.** The opening is shared, so on a lucky day everyone gets the same "Awesome start" badges.
- **Not cheat-proof, by design.** Clearing localStorage restarts the game, and a determined player could call the APIs by hand. The server only does light sanity checks, e.g. the throw log must start with the day's opening.
- **Dev-only routes.** `/vedot-preview?view=sheet|tracker|stamp|settlement|jackpot|reveal|stakes|teaser|game` and `/mokki-preview` are only registered in dev builds.

## 5. Running the tests

- `npm test`: unit tests for pricing, settlement rules and the Mökki catalog.
- `supabase/tests/README.md`: SQL scenario tests against a throwaway local Postgres.
