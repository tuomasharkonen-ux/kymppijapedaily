
# Add Average Throws to Share Text

## Overview

Add the current average throw count and its movement indicator (up/down) to the shareable result text that gets copied to clipboard.

## Current Share Format

```
Kymppijape daily 30.01.2026
Throws today: 15
🎲🎲🎲🎲🎲🎲🎲🎲🎲🎲🎲🎲🎲🎲🎲
Personal best: 12
```

## New Share Format

```
Kymppijape daily 30.01.2026
Throws today: 15
🎲🎲🎲🎲🎲🎲🎲🎲🎲🎲🎲🎲🎲🎲🎲
Personal best: 12
Average: 18.5 (↓0.3)
```

The arrow shows improvement (lower is better in this game):
- **↓** (down arrow) = average decreased = improvement
- **↑** (up arrow) = average increased = got worse
- No arrow if this is the first game or average stayed the same

---

## Implementation Steps

### Step 1: Track Previous Average in useGameRecords Hook

Modify `useGameRecords.ts` to calculate the previous average (before today's game):

- Add new state: `previousAverage`
- When calculating stats, also compute what the average was before today's result
- This is calculated by excluding today's result from the calculation

### Step 2: Return Previous Average from Hook

Add `previousAverage` to the return object so it's available in the Index page.

### Step 3: Update Share Text in Index.tsx

Modify the `copyResultToClipboard` function to:
- Include the current average
- Calculate the difference from previous average
- Add appropriate arrow indicator (↓ for improvement, ↑ for worse)
- Format the difference with sign (+/-) or as improvement/decline

---

## Technical Details

### Calculating Previous Average

```typescript
// In useGameRecords.ts
if (userRecords.length > 1 && todayData) {
  // Filter out today's result to get previous average
  const previousRecords = userRecords.filter(r => r.played_date !== today);
  const prevSum = previousRecords.reduce((acc, r) => acc + r.throws_count, 0);
  const prevAvg = prevSum / previousRecords.length;
  setPreviousAverage(Math.round(prevAvg * 10) / 10);
} else {
  setPreviousAverage(null); // First game, no previous average
}
```

### Share Text Construction

```typescript
// In Index.tsx copyResultToClipboard
let averageLine = `Average: ${averageThrows}`;
if (previousAverage !== null && averageThrows !== null) {
  const diff = averageThrows - previousAverage;
  if (diff !== 0) {
    const arrow = diff < 0 ? '↓' : '↑';
    const absDiff = Math.abs(diff).toFixed(1);
    averageLine += ` (${arrow}${absDiff})`;
  }
}
```

---

## Files to Modify

1. **`src/hooks/useGameRecords.ts`**
   - Add `previousAverage` state
   - Calculate previous average excluding today's result
   - Return `previousAverage` in the hook

2. **`src/pages/Index.tsx`**
   - Destructure `previousAverage` from hook
   - Update `copyResultToClipboard` to include average with movement indicator

---

## Edge Cases

- **First game ever**: No previous average to compare - show just "Average: X" without movement
- **Average unchanged**: Show just "Average: X" without arrow
- **No today result**: Share button shouldn't be visible anyway (already handled)
