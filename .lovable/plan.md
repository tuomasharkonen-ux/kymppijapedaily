

# Plan: Add Framer Motion for Smooth Animations and Micro-Interactions

## Overview

This plan introduces Framer Motion to replace and enhance the current CSS-based animations throughout Kymppijape Daily. Framer Motion provides physics-based animations, gesture support, and layout animations that will make the game feel more polished and responsive.

## Current State Analysis

The app currently uses:
- Tailwind CSS keyframe animations defined in `tailwind.config.ts` (dice-roll, dice-shake-intense, dice-blow, dice-cower, pop-in, pulse-glow, etc.)
- CSS transitions for hover states and basic effects
- `tailwindcss-animate` plugin for radix-ui component animations

### Current Animation Inventory
| Component | Current Animation | Improvement Opportunity |
|-----------|------------------|------------------------|
| Dice.tsx | CSS keyframes for roll/shake/blow/cower | Spring physics, stagger effects |
| GameBoard/PracticeMode | CSS animate-border-glow, animate-pop-in | Layout animations, presence |
| BadgeUnlockModal | CSS pop-in, epic-entrance, legendary-entrance | Orchestrated sequences |
| InsultDisplay | CSS fade-in with manual translate | AnimatePresence exit animations |
| ResultsPanel | Static grid | Staggered entrance animations |
| BadgesSection | Static grid | Grid layout animations |
| ActionButtons | Basic hover | Tap feedback, spring hover |
| Stat counters | None | Animated number counting |

---

## Implementation Plan

### Phase 1: Setup and Core Components

**1.1 Install Framer Motion**
- Add `framer-motion` package to dependencies

**1.2 Create Animation Utilities**
- Create `src/lib/animations.ts` with reusable motion variants:
  - `fadeIn`, `fadeOut` - basic opacity transitions
  - `popIn` - scale + opacity spring animation
  - `slideUp`, `slideDown` - vertical slide animations
  - `staggerContainer` - parent variant for staggered children
  - `staggerItem` - child variant for staggered animations

**1.3 Create Motion Wrapper Components**
- Create `src/components/motion/MotionDiv.tsx` - pre-configured motion.div with common patterns
- Create `src/components/motion/AnimatedNumber.tsx` - smooth number counting animation

---

### Phase 2: Dice Component Enhancements

**2.1 Refactor Dice.tsx**
Convert from CSS animations to Framer Motion:
- **Rolling animation**: Replace `animate-dice-roll` with `motion.button` using `rotate` and `scale` with spring physics
- **Shake animation**: Use `motion.button` with `x` and `rotate` oscillations via keyframe array
- **Blow animation**: Animate `x`, `rotate`, `scale` with spring physics
- **Cower animation**: Animate `scale` with wobble effect
- **Lock/unlock**: Add spring-based scale pulse when toggling lock state
- **Hover state**: Replace CSS `hover:scale-105` with `whileHover` for smoother feel

**2.2 Dice Dots Animation**
- Animate dots appearance when dice value changes using `AnimatePresence` and `motion.div`
- Stagger dot animations for visual interest

**2.3 Scrambled State Transition**
- Use `AnimatePresence` for smooth icon swap transitions
- Add subtle rotation animation to scrambled icons

---

### Phase 3: Game Board Improvements

**3.1 GameBoard.tsx and PracticeMode.tsx**
- **Initial card glow**: Convert `animate-border-glow` to Framer Motion `boxShadow` animation
- **Stats counters**: Use `AnimatedNumber` component for throw count and locked count
- **Dice grid**: Add staggered entrance animation when game starts
- **Win celebration**: Orchestrated animation sequence (dice bounce, then text pop-in)
- **Button states**: Add `whileTap` scale-down feedback

**3.2 ActionButtons.tsx**
- Add `whileHover` scale and glow effects
- Add `whileTap` scale-down for tactile feedback
- Animate button appearance with stagger when multiple actions available

---

### Phase 4: UI Component Polish

**4.1 InsultDisplay.tsx**
- Wrap in `AnimatePresence` for proper exit animations
- Replace CSS fade with Framer Motion `opacity` and `y` animation
- Add subtle `scale` bounce on entrance
- Animate speech bubble tail separately

**4.2 ResultsPanel.tsx**
- Add staggered entrance for stat cards
- Use `AnimatedNumber` for all numeric values
- Add hover micro-interaction on stat cards

**4.3 BadgesSection.tsx**
- Staggered entrance for badge grid
- Add spring hover effect on individual badges
- Layout animation when badges are added

**4.4 BadgeUnlockModal.tsx**
- Replace CSS entrance animations with Framer Motion sequences
- Create orchestrated animation: backdrop fade, modal scale-in, icon bounce, text fade-in
- Add subtle floating animation for legendary badges

---

### Phase 5: Additional Enhancements

**5.1 Page Transitions**
- Add route transition animations using `AnimatePresence` at router level
- Fade/slide between pages

**5.2 Loading States**
- Replace `animate-pulse` with smoother Framer Motion pulse
- Add skeleton shimmer effects

**5.3 Toast/Notification Animations**
- Enhance sonner toast entrance/exit if customizable

---

## Technical Details

### New File Structure
```text
src/
  lib/
    animations.ts          # Reusable motion variants
  components/
    motion/
      index.ts             # Barrel export
      MotionDiv.tsx        # Pre-configured motion wrapper
      AnimatedNumber.tsx   # Counting number animation
      StaggerContainer.tsx # Container for staggered children
```

### Animation Variants Example (`src/lib/animations.ts`)
```typescript
export const popIn = {
  initial: { scale: 0, opacity: 0 },
  animate: { 
    scale: 1, 
    opacity: 1,
    transition: { type: "spring", stiffness: 500, damping: 30 }
  },
  exit: { scale: 0.8, opacity: 0 }
};

export const staggerContainer = {
  animate: {
    transition: { staggerChildren: 0.05 }
  }
};

export const staggerItem = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 }
};
```

### Dice Animation Configuration
```typescript
// Spring physics for dice animations
const diceSpring = { type: "spring", stiffness: 300, damping: 20 };

// Shake animation using keyframes
const shakeAnimation = {
  x: [-3, 3, -5, 5, -7, 7, -5, 5, -2, 0],
  rotate: [-2, 2, -3, 3, -4, 4, -3, 2, -1, 0],
  transition: { duration: 0.8 }
};
```

### AnimatedNumber Component
```typescript
// Uses useMotionValue and useTransform for smooth counting
const AnimatedNumber = ({ value, duration = 0.5 }) => {
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (v) => Math.round(v));
  
  useEffect(() => {
    animate(motionValue, value, { duration });
  }, [value]);
  
  return <motion.span>{rounded}</motion.span>;
};
```

---

## Migration Strategy

1. **Keep CSS fallbacks**: Maintain existing Tailwind animations initially as fallbacks
2. **Incremental adoption**: Convert components one by one, testing each
3. **Remove CSS animations**: Once Framer Motion versions are stable, remove unused CSS keyframes from `tailwind.config.ts`

---

## Performance Considerations

- Use `layout` prop sparingly (only where needed for layout shifts)
- Leverage `willChange` hints for frequently animated elements
- Use `useReducedMotion` hook to respect user preferences
- Prefer `transform` and `opacity` animations (GPU-accelerated)

---

## Summary

| Area | Key Changes |
|------|-------------|
| Package | Add `framer-motion` dependency |
| Dice animations | Spring physics, stagger effects, gesture feedback |
| Game board | Animated counters, orchestrated win sequence |
| Modals | Sequenced entrance animations |
| Stats/Badges | Staggered grid animations |
| Buttons | Tap/hover micro-interactions |
| Numbers | Smooth counting animations |

This implementation will make the game feel significantly more polished and responsive, with physics-based animations that feel natural and satisfying to interact with.

