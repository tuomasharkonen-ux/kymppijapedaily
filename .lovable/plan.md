
# Shake and Blow Dice Actions Implementation Plan

## Overview

This plan implements interactive action buttons for the "Shake Dice" and "Blow Dice" shop items. When a user owns one or both actions, secondary buttons appear below the main "Roll Dice" button. Pressing an action triggers a fun animation and scrambles the dice visually (hiding numbers with placeholder icons) to create the illusion of preparation before the actual roll.

---

## Feature Behavior

**User Flow:**
1. User purchases "Shake Dice" or "Blow Dice" action from shop
2. On the game board, corresponding action button(s) appear below "Roll Dice"
3. User clicks action button (e.g., "Shake")
4. Dice animate with the shake/blow effect
5. Unlocked dice show scrambled placeholder state (question marks or swirl icons)
6. User must still click "Roll Dice" to actually roll and reveal new values
7. Multiple actions can be triggered in sequence before rolling

---

## Animation Designs

### Shake Dice Animation
- All unlocked dice rapidly shake left-right for ~800ms
- Dice jiggle with increasing intensity, then settle
- Sound of dice rattling (visual only, no audio)
- After animation: dice faces show "?" placeholders

### Blow Dice Animation
- Visual "wind" effect sweeps across the dice from left to right
- Dice slightly rotate/tilt as if blown by wind
- Floating particle effects (small dots) drift across
- After animation: dice faces show spiral/swirl placeholders

---

## Technical Implementation

### Step 1: Add New Keyframe Animations

Add to `tailwind.config.ts`:
- `dice-shake-intense`: Rapid back-and-forth shaking with increasing amplitude
- `dice-blow`: Slight rotation and bounce as if hit by wind
- `wind-particles`: Floating particles moving right to left

### Step 2: Update Dice Component

Modify `Dice.tsx` to:
- Add new prop: `isScrambled: boolean` - shows placeholder instead of dots
- Add new prop: `animationType?: 'shake' | 'blow' | null` - triggers action animation
- When `isScrambled` is true, render a "?" or swirl icon instead of dot pattern
- Apply animation classes based on `animationType`

### Step 3: Create Action Buttons Component

Create `src/components/ActionButtons.tsx`:
- Accepts `purchasedItems`, `activeAction`, and `onActionClick` props
- Filters shop items to show only owned actions
- Renders secondary/outline styled buttons below main roll button
- Each button shows emoji + action name (e.g., "🫨 Shake" and "💨 Blow")
- Only visible when user owns at least one action

### Step 4: Update GameBoard State Management

Modify `GameBoard.tsx` to:
- Add new state: `isScrambled: boolean` - tracks if dice are in scrambled state
- Add new state: `currentAction: 'shake' | 'blow' | null` - tracks active animation
- Add `triggerAction(actionType)` function that:
  1. Sets `currentAction` to trigger animation
  2. After animation duration, sets `isScrambled = true`
  3. Clears `currentAction` after animation completes
- Pass new props to `Dice` components
- When `rollDice()` is called, clear `isScrambled` state
- Pass owned actions to render action buttons

### Step 5: Update Index Page Props

Modify `Index.tsx` to:
- Pass `purchasedItems` array to `GameBoard`
- Pass `activeAction` setting (for potential future use)

---

## Visual States for Scrambled Dice

When `isScrambled = true`, dice will show:
- A question mark "?" icon in the center
- Subtle pulsing animation to indicate "ready to roll"
- Maintains skin styling (golden, diamond, etc.)

---

## File Changes Summary

| File | Type | Changes |
|------|------|---------|
| `tailwind.config.ts` | Modify | Add shake/blow keyframe animations |
| `src/components/Dice.tsx` | Modify | Add `isScrambled` and `animationType` props, render placeholder |
| `src/components/ActionButtons.tsx` | Create | New component for action buttons |
| `src/components/GameBoard.tsx` | Modify | Add scrambled state, action handling, render action buttons |
| `src/pages/Index.tsx` | Modify | Pass `purchasedItems` to GameBoard |
| `src/components/PracticeMode.tsx` | Modify | Add action button support for practice mode (optional) |

---

## Technical Details

### New Tailwind Animations

```text
Keyframes to add:

dice-shake-intense:
  0%, 100%: translateX(0) rotate(0deg)
  10%: translateX(-3px) rotate(-2deg)
  20%: translateX(3px) rotate(2deg)
  30%: translateX(-5px) rotate(-3deg)
  40%: translateX(5px) rotate(3deg)
  50%: translateX(-7px) rotate(-4deg)
  60%: translateX(7px) rotate(4deg)
  70%: translateX(-5px) rotate(-3deg)
  80%: translateX(5px) rotate(2deg)
  90%: translateX(-2px) rotate(-1deg)

dice-blow:
  0%: translateX(0) rotate(0deg) scale(1)
  20%: translateX(4px) rotate(3deg) scale(1.02)
  40%: translateX(8px) rotate(5deg) scale(1.05)
  60%: translateX(4px) rotate(3deg) scale(1.02)
  80%: translateX(2px) rotate(1deg) scale(1.01)
  100%: translateX(0) rotate(0deg) scale(1)
```

### Dice Component Props Update

```text
interface DiceProps {
  value: number;
  isLocked: boolean;
  isRolling: boolean;
  isScrambled?: boolean;        // NEW - shows placeholder
  animationType?: 'shake' | 'blow' | null;  // NEW - triggers animation
  onClick: () => void;
  disabled?: boolean;
  skin?: DiceSkin;
}
```

### GameBoard State Updates

```text
New state:
- isScrambled: boolean (default: false)
- currentAction: 'shake' | 'blow' | null (default: null)

Flow when action button clicked:
1. Set currentAction to 'shake' or 'blow'
2. Start animation duration timer (800ms)
3. After animation: set isScrambled = true, currentAction = null

Flow when "Roll Dice" clicked:
1. Set isScrambled = false
2. Continue with existing roll logic
```

### Action Buttons Layout

```text
+----------------------------------+
|         🎲 Roll Dice             |  <- Primary button (existing)
+----------------------------------+

+---------------+  +---------------+
|  🫨 Shake     |  |  💨 Blow      |  <- Secondary buttons (new)
+---------------+  +---------------+
```

---

## Edge Cases

1. **Already scrambled**: Clicking action again re-triggers animation but dice stay scrambled
2. **During rolling**: Action buttons disabled while dice are rolling
3. **Game complete**: Action buttons hidden/disabled after game completion
4. **No owned actions**: Action buttons section not rendered at all
5. **First roll**: Can use actions before first roll (dice start as empty, become scrambled)

---

## Accessibility

- Action buttons have proper aria-labels
- Announce "Dice scrambled, ready to roll" to screen readers after action
- Buttons are keyboard accessible
- Animation respects `prefers-reduced-motion` media query
