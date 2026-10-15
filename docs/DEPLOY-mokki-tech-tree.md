# Deploying the Mökki Rakennuspuu (tech tree, chores, dog, neighbors)

Branch: `feature/mokki-tech-tree`. Plan: `docs/plans/2026-10-15-mokki-tech-tree.md` (visual version: the `.html` next to it).

## What was tested before deploy

Nothing here has run against the real Supabase project yet. What has been checked:
- The SQL ran against a throwaway local Postgres.
- The edge functions pass `deno check`.
- The rules have unit tests (`npm test`).
- The UI was screenshotted in a headless browser with mock data on the dev-only preview routes.

## 1. Apply the migration (Lovable SQL editor, project `sbnojaeuhjufjbljokgl`)

The Supabase MCP points at a different project, so use the Lovable SQL editor.

Run `supabase/migrations/20261015120000_mokki_tech_tree.sql` in full. It adds:
- `mokki_pieces.variant` (dog breed or flag) and `mokki_pieces.nickname` (dog name)
- `user_settings.peaceful_mokki`
- tables `mokki_actions` (chores, pranks and visits; the daily limits are a unique index) and `mokki_effects` (prank marks plus the mailbox inbox)
- RPCs `get_mokki_island(user_id)` and `mark_mokki_effects_seen()`

Existing `mokki_pieces` rows are not touched. Pieces bought before the tree stay owned and are tagged "🏃 ahead of its time" in the tree.

## 2. Deploy the edge functions

| Function | Status | What it does |
|---|---|---|
| `mokki-action` | **New** | Chores, pranks, visits, flag/dog settings, prank cleanup. Every random roll and every credit happens here. |
| `buy-mokki-piece` | Redeploy | Enforces the tree order: parents must be *finished*, era day gates apply. Also takes the dog's breed and name. |
| `check-achievements` | Redeploy | Streak badges respect hammock naps, and the streak is now counted on Helsinki dates. |

- `supabase/config.toml` already has `verify_jwt = false` for `mokki-action`.
- All three import `supabase/functions/_shared/mokki.ts`, so deploy `_shared` alongside them.

## 3. Smoke test

- [ ] Open the Mökki page: the bottom bar shows the Rakennuspuu. Open it and check that existing pieces show as built. Grandfathered ones (e.g. a Grillikota without a Nuotiopaikka) have the 🏃 tag.
- [ ] Buy the Nuotiopaikka. It builds after 1 played day.
- [ ] A piece whose parent is still building says "Wait for X to finish".
- [ ] Play today, then tap a chore chip, e.g. 🌭. Credits go up, and the chip shows ✓ until tomorrow. `credit_ledger` gets a `mokki_makkara` row.
- [ ] Buy the Koira: pick a breed and a name. After 2 played days the dog walks around the island. Tap it to open the dog sheet (Rapsuta, rename, switch breed).
- [ ] With a second account, visit the first mökki and TP it 😈. The first account sees TP on the birches and a raised mailbox flag. The inbox lists it, and tapping the TP cleans it up (+2).
- [ ] Turn on Rauhallinen mökki in Customization. The prank picker now says it's a peaceful mökki.

## 4. Things to know

- **Rantasauna now needs the Puuvaja and 10 days played.** Players who already own a sauna keep it.
- **Coming soon:** Mehiläispesät, Aurinkopaneeli, Mökkiradio, Avanto, Silta, Aitta, Perämoottori and the era IV wonders show as "Tulossa" silhouettes. The server refuses to sell them.
- **Economy knobs:** all in `REWARDS` and `CATCHES` in `_shared/mokki.ts`. Change them there and redeploy `mokki-action`.
- **Streak change:** the server streak used the server's local date before; it now uses Helsinki dates, the same as the client.
- **After pushing:** watch for Lovable bot commits that revert files from a stale copy (this happened with the Vedot rollout).
