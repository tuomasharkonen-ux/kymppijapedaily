# Plan: Vedot, Päivän Potti & Jackpot (+ Mökki concept)

Status: implemented on branch `feature/vedot-potti-mokki` (2026-10-06). See `docs/DEPLOY-vedot-mokki.md` for rollout.

## Implementation notes (where the build differs from the plan below)
- **Simplified after review (2026-10-06):**
  - Lempinumero removed.
  - Labels are English, except Lukitut nopat (an inside joke):
    - Varma / Rohkea / Hullu → Safe / Bold / Crazy
    - Nopea Jape → Quick Finish
    - Keskiarvon alle → Beat Your Average
    - Ennätysjahti → Record Chase
    - Päivän Potti → Pot of the Day
    - Eilisen Potti → Yesterday's Pot
    - Vedonlyöntilupa → Betting License
    - PELATTU → LOCKED IN
  - The jackpot sits on its own row above the pot.
  - Internal ids (`nopea`, `varma`, …) are unchanged.
- **No `daily_boards` table and no Monte Carlo.** For greedy play the odds have an exact closed form, P(T ≤ n) = (1 − (5/6)^(n−1))^(10−k). The opening is deterministic per day, so client and server compute identical odds from the shared module `supabase/functions/_shared/kymppijape.ts`, and the server prices every bet itself.
- **Jackpot pays out instantly** to the first ticket holder who wins in ≤ 5 throws, then reseeds at 200. Splitting same-day hits would delay the payout moment to midnight.
- **Lukitut nopat can be added to any bet**, not just Quick Finish. It applies to the whole game, and the UI blocks unlocking and locking a different number.
- **Security fix:** clients can no longer execute `increment_user_credits` / `decrement_user_credits` (they were SECURITY DEFINER with default grants).
- **Bets settle inside `save-game-result`.** Pots settle lazily on the first `get-daily-board` call after Helsinki midnight.
- **Mökki catalog (4500 cr total):**
  - Huussi 150, Lipputanko 200, Marjapensaat 250, Riippumatto 250, Puuvaja 300
  - Laituri 500 (10 days played)
  - Soutuvene 450 (needs Laituri)
  - Rantasauna 700
  - Grillikota 800 (30 days)
  - Palju 900 (needs sauna, 30 days)
  - Pieces build over 1–4 played days.
- **New badges:** First Bet, Pot Master, Absolutely Crazy, Jackpot!.

## Goals
- Give veteran players (2000–3000 credit hoards) something to spend on that also gives every daily game stakes.
- Keep one daily game. Keep dice truly random. Keep it silly.
- **First-time experience stays as simple as today.** Depth is unlocked with credits.
- The betting UI is fun, animated and thematic, not a spreadsheet.

## Non-goals
- Full cheat-proofing. Light, honest-player integrity is enough (like Wordle).
- Leagues, multiple pots, real money.

## Design rule: bets must never reward playing slowly
The player decides when to lock the last die. They can refuse to lock matching dice and keep re-rolling, so they can always make a game *longer*, but never *shorter*.
So every bet must be one where the fastest play is always best. Under that rule:
- ✅ Allowed: "finish in ≤ N", "win on number X", "never unlock", "beat your average/best", fewest throws in the pot, jackpot ≤ 5.
- ❌ Removed:
  - Pitkä Löyly (> N throws)
  - Tarkka-ampuja (exactly N)
  - Pariton/Parillinen (odd/even)
  - Jumittaja (last die stuck)
  - Kolmoispotku (3+ hits in one throw)
  - Ei kuivaa (no throw with zero hits)

  All of these can be steered by stalling, or by keeping extra dice unlocked.

---

## 0. Foundations

### 0.1 Shared opening, random throws
- The opening (throw 1) is seeded by **date only**: `getSeededDice("kymppijape", gameDate)`. Every throw after that stays `Math.random()`.
- Everyone sees the same opening, so one odds board per day works for everyone.
- `starter_match` badges will be earned by everyone on the same day. That's acceptable, and it makes a shared "did you see today's start?!" moment.

### 0.2 Game-in-progress persistence (anti-refresh)
- Save `{ dice, throwCount, throwLog, unlockedAny }` to `localStorage` (`kymppijape_game_<userId>_<gameDate>`) after every throw and every lock/unlock.
- Restore on mount, so a refresh continues the same game.
- Placed bets and pot entry are stored on the server.
- Not cheat-proof, by design.

### 0.3 One definition of "game day"
- Use the **Europe/Helsinki** date on both the client and the server. Today the server uses UTC and the client uses the local date.

---

## 1. Progression & onboarding (depth unlocked with credits)

A first-time player sees exactly what they see today: the game and their results. Nothing about betting.

| Stage | What the player sees |
|---|---|
| Day 1 | Game → result → badges and credits explained once ("you earned 10 cr!") |
| Has credits | Shop card appears; cosmetics as today |
| Shop: **Vedonlyöntilupa** (betting licence) — 300 cr, "Features" category | Unlocks Vedot, Päivän Potti and jackpot eligibility. Shown as a locked teaser tile with a short animated preview until bought |
| Shop: **Mökkitontti** (cabin plot) — 1000 cr | Unlocks the Mökki and revamps the home screen (section 6) |

- 300 cr takes a new player roughly 2–4 weeks of badges. Veterans can buy it on day one.
- Players without the licence never see the betting sheet. They just roll. During the day they see a small "🪙 3 players in today's pot" teaser on the game card (tap it to go to the shop), which spreads the feature socially.
- The Vedonlyöntilupa has no ongoing fee. The ongoing sink is the house edge on bets plus the pot's cut.

---

## 2. Daily flow (licence owners)

```
[Home: Today's game card]  jackpot meter · pot status · "Throw the opening"
        ▼
[Opening reveal]  same dice for everyone; they stay visible at the top
        ▼
[Vedot & Potti sheet]  slides up · join the pot · pick bets · LOCK IN / Just play
        ▼
[Game]  bet tracker strip above the dice (alive → won / busted)
        ▼
[Win]  confetti or cinematic → bets settle one by one → jackpot check → "Potti at midnight"
        ▼ next day, first app open
[Eilisen Potti reveal]
```

- Bets are placed **after** seeing the opening, with odds priced for that opening, so a friend who played earlier can't tip you off about a good start.
- Locking a die closes betting for the day.
- Practice mode has no betting.

---

## 3. Vedot (bets)

### 3.1 Nopea Jape: three tiers, you choose how lucky you need to be
Each day, the server picks the N for each tier so that the tiers land near ~50% / ~20% / ~5%. The payouts stay in a familiar range while N moves with the opening.

Example opening: four 3s, two 5s (simulated).

| Tier | Today's line | Chance | Odds |
|---|---|---|---|
| 🙂 **Varma** (safe) | ≤ 13 throws | 49% | ×1.8 |
| 😬 **Rohkea** (bold) | ≤ 9 throws | 21% | ×4.3 |
| 🤯 **Hullu** (crazy) | ≤ 6 throws | 4.6% | ×19 |

### 3.2 Add-ons (stack on any Nopea Jape bet)
- 🔢 **Lempinumero**: you must also win on a number you choose. Its odds depend on how many of that number are in the opening.
  Example, Rohkea ≤9: 3s → ×4.3 (no extra), 5s → ×7.3, 6s → ×9.5.
- 🔒 **Lukitut nopat**: once a die is locked it stays locked; the UI disables unlocking. ×1.1.

### 3.3 Personal bets
Unlocked after 5 recorded games. Odds are priced from today's distribution against your own stats.

| Bet | Wins when | Example (avg 15, best 7) |
|---|---|---|
| 📉 **Keskiarvon alle** | You beat your all-time average | 56% → ×1.6 |
| 🏅 **Ennätysjahti** | You tie or beat your personal best | 9% → ×10 |

### 3.4 Limits & pricing
- Up to 3 bets per day; total stake 10–300 cr.
- About 88% return to player, odds capped at ×100.
- Once per day, the server simulates 50k games from the opening for each target number and stores the throw-count histograms in `daily_boards`. Every bet (tiers, Lempinumero, personal bets) is priced by reading those histograms, so odds are instant and never come from the client.

### 3.5 Betting sheet UI

```
┌─────────────────────────────────────┐
│ 🎲 Today's opening                   │
│ [3][3][3][5][1][6][2][3][5][4]      │  ← stays visible, slightly dimmed
├─────────────────────────────────────┤  ← bottom sheet
│ 💰 2 480 cr          🏆 JACKPOT 640  │
│ ┌── PÄIVÄN POTTI ─────────────────┐ │
│ │ ♨️ [kiulu, steam, coins inside]  │ │
│ │ 😎 Matti  🤠 Liisa   Pot 150 cr  │ │
│ │ [ 🪙 Hop in for 50 ]             │ │
│ └─────────────────────────────────┘ │
│ NOPEA JAPE                          │
│ ┌────────┐┌────────┐┌────────┐      │
│ │🙂 Varma ││😬Rohkea ││🤯 Hullu │      │  ← tap to select; odds as split-flap
│ │ ≤13    ││  ≤9    ││  ≤6    │      │
│ │ ×1.8   ││ ×4.3   ││ ×19    │      │
│ └────────┘└────────┘└────────┘      │
│ + 🔢 Lempinumero [1][2][3][4][5][6]  │  ← odds re-flip on pick
│ + 🔒 Lukitut nopat          ×1.1     │
│ Stake: (10)(25)(50)(100)            │
│ PERSONAL  📉 Keskiarvon alle ×1.6    │
│           🏅 Ennätysjahti    ×10     │
├─────────────────────────────────────┤
│ 🧾 2 bets · 75 cr · max +412         │
│ [ 🔒 LOCK IN ]        Just play →    │
└─────────────────────────────────────┘
```

### 3.6 Animation & effects
- **Sheet:** springs up after the opening dice land.
- **Odds:** split-flap digit flips whenever a tier or add-on changes.
- **Stake chips:** stack with a bounce, then arc-fly into the slip.
- **Kiulu (pot):** joining drops a coin with a splash and steam; the bucket fills visibly as the pot grows.
- **Jackpot meter:** glow pulse, with a shimmer on round numbers.
- **Lock in:** a "PELATTU!" rubber stamp slams down, with a small screen shake and `navigator.vibrate`.
- **In-game tracker chips:** turn green when won, and crack and sizzle into steam when busted (e.g. the ≤9 chip dies on throw 10).
- **Settlement:** a cascade, one bet at a time. Wins trigger a coin fountain and a rolling `AnimatedNumber`; losses hiss on sauna stones.
- **Jackpot hit:** full-screen takeover with gold rain.

---

## 4. Päivän Potti

- **Joining:**
  - Requires the licence.
  - Join on the betting sheet before your first lock. Fixed buy-in of **50 cr**.
- **During the day:** entrants and the pot size are visible to everyone. **Scores stay hidden** until the reveal, so later players can't decide whether to enter based on the score to beat.
- **Winner:** the fewest throws.
  - Ties split the pot; any remainder goes to the jackpot.
  - The house takes 10% for the jackpot.
- **Edge cases:**
  - Only one entrant: full refund.
  - An entrant who doesn't finish their game that day forfeits the buy-in.
- **Settlement:**
  - Lazy and idempotent: the first app load after Helsinki midnight settles all past open pots (with a row lock).
  - pg_cron can be added later as a backup.
- **"Eilisen Potti" reveal:**
  - Shown once to every entrant on their next app open.
  - Cards flip worst to best with a drumroll; the last card is the winner.
  - Then the kiulu tips over and coins pour into the winner's balance.
  - Tracked with `pot_entries.reveal_seen_at`.
  - With the Mökki, this arrives as a letter in the mailbox (section 6).

## 5. Jackpot
- **Funded by:** the pot's 10% cut, 5% of every lost bet, and a 200 cr seed after each payout.
- **Trigger:** win in **≤ 5 throws** (about 2% per game, so roughly one hit every ~10 days across 6 players).
- **Eligibility:** you must have joined the pot or placed a bet that day.
- If several players hit on the same day, they split it.

---

## 6. Mökki (concept, separate phase)

### Where it lives
Buying **Mökkitontti** turns the home screen into the cabin:

```
┌─────────────────────────────────────┐
│   [ live isometric 3D diorama ]     │  ~45% of the screen
│   lake · birches · sauna · dock     │  chimney smokes once you've played today
│   📬 mailbox  ♨️ kiulu  📋 notice board│  tappable objects on the porch
├─────────────────────────────────────┤
│  🎲 Today's game  [ Throw ]          │  the daily game stays one tap away
│  results · badges …                 │
└─────────────────────────────────────┘
```
- Tapping the diorama opens a **full-screen build/explore mode** (rotate, zoom, build pieces).
- Porch objects act as navigation:
  - The mailbox delivers the Eilisen Potti reveal and badge letters.
  - The kiulu shows today's pot.
  - The notice board shows badges.
- The cabin becomes the hub without hiding the daily game.
- Players without the plot keep today's simple home screen.

### Visual approach: low-poly 3D with an isometric camera (react-three-fiber) ⭐
- **Look:** a small island on a lake, in the style of Townscaper / Islanders / Monument Valley. Orthographic camera, drag to gently rotate, pinch to zoom.
- **Assets:** pieces are built in code from primitives (log walls from stacked cylinders, prism roofs, birches), so no 3D artist is needed.
- **Size:** about 200 KB, lazy-loaded only for plot owners.
- **Alternatives:**
  - Pre-rendered isometric sprites: crisper, but every change means re-rendering art.
  - A painted parallax scene that moves with device tilt: very atmospheric, but less of a builder.

### Making it feel alive
- Day/night and seasons follow real Helsinki time and date: midnight sun, kaamos, ruska, frozen lake, juhannuskokko, revontulet.
- Chimney smoke means you've played today.
- Loon calls; mosquitoes in July.
- Mushrooms in autumn if you own Suomen Sienet. Your active dice skin sits on the porch table.
- Building: pieces arrive as scaffolding and finish after N played days, then drop in with dust and a hammer sound.
- Visit friends' islands from the leaderboard and send "löyly", which puffs steam from their chimney.

### Next step
A 1–2 day R3F spike (one island, a procedural log sauna, water, day/night, smoke) to judge the feel before committing.

---

## 7. Data model (Supabase)

| Table | Key columns |
|---|---|
| `daily_boards` | `game_date` PK, `opening int[]`, `histograms jsonb` (per target number), `tiers jsonb` (N and odds per tier) |
| `bets` | `id`, `user_id`, `game_date`, `bet_type` (`nopea`/`keskiarvo`/`ennatys`), `params jsonb` (tier, number, lukitut), `stake`, `odds`, `status`, `payout` |
| `pots` / `pot_entries` | `game_date`, `buy_in`, `status`, `total`, `winner_ids`; entries: `user_id`, `throws_count`, `reveal_seen_at` |
| `jackpot` / `jackpot_wins` | singleton `balance`; win history |
| `credit_ledger` | `user_id`, `delta`, `reason`, `ref_id` (audit trail and "what happened" UI) |
| `game_records` + | `throw_log jsonb`, `unlocked_any bool` |
| shop | new `feature` category: `betting_license` (300), `mokki_plot` (1000) |

All credit changes go through edge functions or `security definer` RPCs.

## 8. Edge functions
- **`get-daily-board`:** creates today's board if it's missing, then returns the board, jackpot, pot status and my bets. It also triggers lazy pot settlement.
- **`place-bets`:**
  - Checks the licence, the bet window, the limits and the balance.
  - Prices the bets from the board histograms.
  - Debits the stake and inserts the bets and the pot entry.
- **`save-game-result` (extend):**
  - Accepts `throw_log` and `unlocked_any`.
  - Light consistency check: the log starts with the opening and the counts are monotone.
  - Settles bets and the jackpot, and returns a settlement summary for the animation.
- **`settle-pots`:** idempotent settlement of past pots.

## 9. Implementation phases
1. **Foundations:** Helsinki date, shared opening, localStorage persistence, `throw_log`.
2. **Licence + shop "Features" category**, plus the locked teaser tile.
3. **Board & pricing:** `daily_boards`, histogram simulation, `get-daily-board`.
4. **Betting sheet UI + `place-bets`**, with animations.
5. **In-game tracker + settlement cascade.**
6. **Päivän Potti + Eilisen Potti reveal.**
7. **Jackpot.**
8. **Polish:** optional sounds (muted by default), haptics, new badges.
9. *(Separate)* Mökki spike → Mökki.
