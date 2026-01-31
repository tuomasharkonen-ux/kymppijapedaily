
# Unify Share Text Across All Share Buttons

## Problem

There are two separate share buttons with different logic:
1. **GameBoard share button** - appears right after completing a game (doesn't include average)
2. **Index.tsx share button** - on the "come back tomorrow" screen (includes average with movement indicator)

The GameBoard component has its own `copyResultToClipboard` function that's missing the average throws data.

## Solution

Pass the share function from `Index.tsx` down to `GameBoard` as a callback, along with a loading state to ensure stats are ready before sharing.

---

## Implementation Steps

### Step 1: Update GameBoard Props

Add new props to `GameBoard`:
- `onCopyResult`: Callback function to handle the share action
- `isStatsLoading`: Boolean indicating if stats are still loading after game completion

### Step 2: Update GameBoard Component

- Remove the internal `copyResultToClipboard` function
- Remove internal `showCopied` state (will be managed by parent)
- Accept new props: `onCopyResult`, `isStatsLoading`, `showCopied`
- Update the share button to call `onCopyResult` and show loading state when `isStatsLoading` is true

### Step 3: Update Index.tsx

- Pass `copyResultToClipboard` function to `GameBoard` as `onCopyResult`
- Pass `isLoading` from `useGameRecords` as `isStatsLoading`
- Pass `showCopied` state to `GameBoard`

---

## Technical Details

### Updated GameBoard Props Interface

```typescript
interface GameBoardProps {
  // ... existing props
  onCopyResult?: () => Promise<void>;  // Share handler from parent
  isStatsLoading?: boolean;            // Stats loading state
  showCopied?: boolean;                // Copied feedback state
}
```

### Share Button in GameBoard

```typescript
<Button 
  onClick={onCopyResult}
  disabled={isStatsLoading}
  size="lg"
  variant={showCopied ? "secondary" : "default"}
>
  {isStatsLoading ? (
    <>Loading stats...</>
  ) : showCopied ? (
    "Copied to clipboard!"
  ) : (
    <>Share Result with Friends</>
  )}
</Button>
```

---

## Files to Modify

1. **`src/components/GameBoard.tsx`**
   - Add new props: `onCopyResult`, `isStatsLoading`, `showCopied`
   - Remove internal `copyResultToClipboard` function
   - Remove internal `showCopied` state
   - Update share button to use passed props

2. **`src/pages/Index.tsx`**
   - Pass `copyResultToClipboard` as `onCopyResult` to GameBoard
   - Pass `isLoading` as `isStatsLoading`
   - Pass `showCopied` state to GameBoard

---

## Expected Result

- Both share buttons (after game completion and on "come back tomorrow" screen) will use the same share text with average throws and movement indicator
- The share button will show a loading state until stats are updated after saving the game result
- Consistent user experience across all share interactions
