## Helldivers 2 Stratagem Dice Pack

A new shop skin pack that themes all 6 dice faces with iconic Helldivers 2 stratagem icons on a black die, and triggers a face-specific cinematic victory animation when a player wins their daily Kymppijape with all 10 dice showing that face.

### What the user gets

**New shop item: "Helldivers Stratagems" (skin category)**
- Black dice with the 6 stratagem SVGs replacing the standard pips:
  - 1 → Orbital Napalm Barrage
  - 2 → Bastion MK XVI (tank)
  - 3 → Autocannon Sentry
  - 4 → Hellbomb
  - 5 → Eagle 500KG Bomb
  - 6 → Orbital Laser
- Sits alongside Golden / Diamond / German Supermarket / Sauna in the skin row, with preview, modal copy, and purchase flow already handled by the existing system.
- Suggested price: 800 credits (top-tier — it ships with 6 full-screen victory cinematics).

**Face-specific victory animations** — replace the standard green confetti when this skin is active and the player completes a Kymppijape. Each is a full-viewport overlay (pointer-events: none) on top of the existing "Kymppijape!" headline:

1. **Orbital Napalm (1)** — orange/red firestorm: dozens of flame particles erupt from the bottom across the entire screen, lingering smoke + heat-haze tint.
2. **Bastion Tank (2)** — a tank silhouette rolls in from the left, fires 4–5 large shells across the screen with muzzle flashes + impact bursts, then rolls out.
3. **Autocannon Sentry (3)** — the sentry icon descends from the top on a parachute trail, plants itself, then fires a rapid burst of large tracer rounds left-right with shell-casing ejection.
4. **Hellbomb (4)** — the bomb drops in from above, ticks (3 red flashes + beep-style scale pulses), then a massive white flash whites out the entire screen with a shake + chromatic-scramble before fading.
5. **Eagle 500KG (5)** — a large bomb plummets from the top, impacts dead center after ~1s, and erupts into a layered mushroom cloud (fireball → stem → cap) that fills the screen.
6. **Orbital Laser (6)** — a thick yellow/white beam descends from above and sweeps in an S-curve across the page, leaving a glowing scorched/burning trail that smoulders for a moment before fading.

All cinematics finish in ~2.5–3s so they don't block the existing "Share Result" CTA.

### Technical approach

**Assets**
- Copy the 6 uploaded SVGs to `src/assets/helldivers/` (`napalm.svg`, `bastion.svg`, `autocannon.svg`, `hellbomb.svg`, `eagle500.svg`, `laser.svg`) and import as ES6 modules.

**Dice rendering** (`src/components/Dice.tsx`)
- Extend `DiceSkin` type with `"helldivers_dice"`.
- Add a `helldivers_dice` entry to `skinStyles` (black bg, red-tinted border, subtle red glow).
- Add a branch in the render path: when `skin === "helldivers_dice"` and `value > 0`, render the corresponding SVG centered/inset instead of `DiceDotsWithSkin`. A small `faceIcons: Record<1-6, string>` map drives this.
- Same treatment in the previews used by the shop:
  - `src/components/DicePreview.tsx` (static preview tile)
  - Anywhere else that switches on `DiceSkin` (verify via grep).

**Shop catalog** (`src/lib/shopItems.ts`)
- Append one new entry:
  ```ts
  { id: 'helldivers_dice', emoji: '🪖', name: 'Helldivers Stratagems',
    shortDescription: 'Black dice with stratagem icons + cinematic victory animations.',
    longDescription: '...for Super Earth! Six legendary stratagems replace the pips...',
    price: 800, category: 'skin' }
  ```
- No backend migration needed — purchases and `active_skin` already support arbitrary string IDs.

**Victory cinematics**
- New component `src/components/victory/HelldiversVictory.tsx`:
  - Props: `winningNumber: 1..6`, `onComplete: () => void`.
  - Mounted as a fixed full-screen overlay (`fixed inset-0 z-50 pointer-events-none`).
  - Switches on `winningNumber` and renders one of 6 sub-components, each built with Framer Motion (existing dependency) — no new packages.
- Sub-components (one file each under `src/components/victory/`):
  - `NapalmVictory.tsx` — array of motion divs with flame emoji/SVG, animated `y`/`opacity`/`scale`, staggered.
  - `BastionVictory.tsx` — tank container animates `x` across viewport; child shells spawn at intervals with motion + impact flash divs.
  - `AutocannonVictory.tsx` — sentry SVG drops from `y: -200` → settles, then bursts of tracer divs animate horizontally with muzzle flash pulses.
  - `HellbombVictory.tsx` — bomb drops; 3 timed red flashes; white `bg-white` div fades from `opacity: 0` → `1` → `0` with a `filter: hue-rotate` scramble + screen shake via container `x` keyframes.
  - `Eagle500Victory.tsx` — bomb falls, on impact a fireball circle scales 0 → 20, stem rectangle grows upward, cap circle expands, with orange-to-grey color transition.
  - `OrbitalLaserVictory.tsx` — vertical beam div with `transform: translateX` keyframed along an S-curve (5–6 waypoints), trailing scorched path drawn as an SVG `<path>` whose `pathLength` animates 0 → 1, then fades.
- All cinematics call `onComplete` after their duration so the parent can unmount.

**Wiring victory into `GameBoard.tsx`**
- Track `victoryFace` state. In the existing win branch (where `triggerConfetti()` is called):
  - If `activeSkin === "helldivers_dice"`, set `victoryFace = winner` and skip `triggerConfetti()`.
  - Otherwise keep current confetti behavior — no regression for other skins.
- Render `{victoryFace && <HelldiversVictory winningNumber={victoryFace} onComplete={() => setVictoryFace(null)} />}` at the top of the returned tree.

**Scope guards**
- No DB / edge-function / auth changes.
- No changes to leaderboard, badges, or game logic.
- Existing skins, animations, and the Sauna heat system are untouched.

### Files touched

- new: `src/assets/helldivers/{napalm,bastion,autocannon,hellbomb,eagle500,laser}.svg`
- new: `src/components/victory/HelldiversVictory.tsx` + 6 sub-components
- edit: `src/components/Dice.tsx` (add skin variant + SVG-face rendering)
- edit: `src/components/DicePreview.tsx` (mirror in shop preview)
- edit: `src/lib/shopItems.ts` (add catalog entry)
- edit: `src/components/GameBoard.tsx` (trigger cinematic instead of confetti for this skin)
