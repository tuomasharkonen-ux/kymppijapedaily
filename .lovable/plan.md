
# Plan: Speed Up Badge Unlock Popups

## Problem Analysis

The current flow when a game completes runs sequentially:

1. **Save game result** (edge function) - ~200-400ms
2. **Fetch records** (called inside saveGameResult) - ~300-500ms for multiple queries including rankings
3. **Check achievements** (edge function) - ~400-800ms for 6+ database queries

**Total delay: 900-1700ms** before badges can appear

## Solution: Parallel Execution with Optimistic Updates

We can significantly reduce the delay by running operations in parallel since saving the game result and checking achievements are independent once the game data is recorded.

### Implementation Steps

#### 1. Modify `handleGameComplete` in Index.tsx
Run `saveGameResult` and `checkAndAwardBadges` in parallel using `Promise.all`. Both can start simultaneously because:
- `save-game-result` writes the game data
- `check-achievements` reads the game data - but we can pass the necessary context directly

#### 2. Pass game data directly to `checkAndAwardBadges`
The `check-achievements` function already receives `usedAction` from the client. We can extend this to run badge checks immediately without waiting for the save to complete, since the edge function independently fetches the game data from the database.

However, there's a dependency: `check-achievements` needs the game to be saved first so it can read `todayGame` from the database.

#### 3. Better approach: Parallel with dependency handling
- Start both calls, but have `check-achievements` be slightly delayed or use a retry pattern
- OR: Fire `checkAndAwardBadges` immediately after `saveGameResult` completes, but don't wait for `fetchRecords`

### Recommended Changes

**File: `src/hooks/useGameRecords.ts`**
- Separate `saveGameResult` from `fetchRecords`
- Return a promise that resolves as soon as the save is complete
- Call `fetchRecords` in the background (don't block on it)

**File: `src/pages/Index.tsx`**
- Call `saveGameResult` and wait for just the save
- Immediately call `checkAndAwardBadges` 
- Let `fetchRecords` run in the background

### Code Changes

**useGameRecords.ts - Split save and fetch:**
```typescript
const saveGameResult = async (throws: number, winningNumber: number) => {
  if (!userId) return;

  // Save the game - this is critical path
  const { data, error } = await supabase.functions.invoke('save-game-result', {
    body: { throws_count: throws, winning_number: winningNumber }
  });

  if (error || data?.error) {
    throw new Error(data?.error || error.message);
  }

  // Refresh records in the background (non-blocking)
  fetchRecords().catch(console.error);
  
  return data;
};
```

**Index.tsx - Parallel badge check:**
```typescript
const handleGameComplete = async (throws: number, winningNumber: number, _initialDice: number[], usedAction: boolean) => {
  setJustCompletedGame(true);
  
  // Save game first (required before badge check can verify)
  await saveGameResult(throws, winningNumber);
  
  // Check badges immediately after save - don't wait for fetchRecords
  checkAndAwardBadges(usedAction);
};
```

### Expected Improvement

**Before:** 
- Save (~300ms) → FetchRecords (~400ms) → CheckBadges (~600ms) = **~1300ms total**

**After:**
- Save (~300ms) → CheckBadges (~600ms) = **~900ms total**
- FetchRecords runs in background

**Improvement: ~400ms faster** (30% improvement)

### Further Optimization (Optional)

If we want even faster badge popups, we could:
1. Use Supabase's `waitUntil` for background tasks in edge functions
2. Implement optimistic badge display (show immediately, verify later)
3. Cache badge definitions client-side to reduce API calls

---

## Technical Details

### Files to Modify
1. `src/hooks/useGameRecords.ts` - Remove blocking `await fetchRecords()` from `saveGameResult`
2. `src/pages/Index.tsx` - Remove `await` from `checkAndAwardBadges` call (fire-and-forget with internal state update)

### Risk Assessment
- **Low risk**: The badge system already handles duplicate prevention server-side
- **No data integrity issues**: Game saves are still verified before badge checks
- **Graceful degradation**: If badge check fails, user still gets the game saved
