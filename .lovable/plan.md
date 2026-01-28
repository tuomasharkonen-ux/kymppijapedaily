

# Purchase System Implementation Plan

## Overview

This plan implements a secure, server-side purchase system for the Dice Pro Shop. Users will be able to spend their earned credits to unlock cosmetic items and actions, with all transactions validated and processed by a backend function to prevent cheating.

---

## Current State

**Already in place:**
- `user_credits` table with RLS (users can only read their own balance)
- `increment_user_credits` database function (SECURITY DEFINER, atomic updates)
- Shop UI with item catalog, modals, and "Coming Soon" buttons
- `check-achievements` edge function pattern for secure server-side operations

**Missing:**
- Table to track purchased items
- Backend function to handle purchases securely
- Frontend logic to call purchase function and display ownership status

---

## Implementation Steps

### Step 1: Create `user_purchases` Table

Create a new table to track which items users have purchased.

```text
Table: user_purchases
+-------------+-------------+----------------------------+
| Column      | Type        | Notes                      |
+-------------+-------------+----------------------------+
| id          | UUID        | Primary key                |
| user_id     | UUID        | References auth user       |
| item_id     | TEXT        | Shop item identifier       |
| purchased_at| TIMESTAMPTZ | When purchase was made     |
+-------------+-------------+----------------------------+
Constraints: UNIQUE(user_id, item_id) - prevent duplicate purchases
```

**RLS Policies:**
- SELECT: Users can read their own purchases
- INSERT: Blocked (WITH CHECK false) - only edge function can insert
- UPDATE/DELETE: Not allowed

---

### Step 2: Create `purchase-item` Edge Function

A new secure backend function that handles the entire purchase flow atomically:

**Endpoint:** `POST /functions/v1/purchase-item`

**Request Body:**
```text
{ "itemId": "golden_dice" }
```

**Server-side validation:**
1. Authenticate user via JWT claims
2. Verify item exists in catalog (hardcoded item list to prevent spoofing)
3. Check user hasn't already purchased this item
4. Verify user has sufficient credit balance
5. Deduct credits using `decrement_user_credits` function (new)
6. Insert purchase record
7. Return success with updated balance

**Error responses:**
- 401: Unauthorized
- 400: Invalid item ID
- 400: Already owned
- 400: Insufficient credits
- 500: Server error

---

### Step 3: Create `decrement_user_credits` Database Function

Similar to `increment_user_credits`, but for deducting credits:

```text
Function: decrement_user_credits(p_user_id UUID, p_amount INTEGER)
- SECURITY DEFINER (bypasses RLS)
- Validates amount is positive and within bounds
- Checks balance >= amount before deducting
- Raises exception if insufficient funds
- Atomic update to prevent race conditions
```

---

### Step 4: Create `useUserPurchases` Hook

A new React hook to fetch and manage purchased items:

```text
Hook: useUserPurchases(userId)

Returns:
- purchasedItems: string[] (list of owned item IDs)
- isLoading: boolean
- purchaseItem: (itemId) => Promise<result>
- refetchPurchases: () => void
```

---

### Step 5: Update Shop UI Components

**Shop.tsx changes:**
- Fetch user's purchases via new hook
- Pass ownership status to item cards
- Handle purchase button click with confirmation

**Item Card updates:**
- Show "Owned" badge for purchased items
- Change button from "Unlock" to "Owned" with checkmark
- Keep "Unlock" button enabled for unpurchased items with sufficient balance
- Show "Not enough credits" state when balance is too low

**ShopItemModal updates:**
- Add purchase confirmation flow
- Show loading state during purchase
- Display success/error feedback via toast

---

## Security Considerations

1. **Item catalog is hardcoded server-side** - Prevents users from purchasing non-existent items or manipulating prices

2. **All credit operations use SECURITY DEFINER functions** - Atomic updates prevent race conditions

3. **RLS blocks direct inserts** - Only edge function with service role can create purchase records

4. **JWT validation required** - All requests authenticated via auth claims

5. **Idempotent purchases** - UNIQUE constraint prevents duplicate purchases even with concurrent requests

---

## Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/purchase-item/index.ts` | Edge function for secure purchases |
| `src/hooks/useUserPurchases.ts` | Hook to fetch and manage purchases |

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/config.toml` | Add `purchase-item` function config |
| `src/pages/Shop.tsx` | Integrate purchase flow, ownership display |
| `src/components/ShopItemModal.tsx` | Add purchase confirmation UI |
| `src/integrations/supabase/types.ts` | Auto-updated after migration |

## Database Changes

| Change | Type |
|--------|------|
| Create `user_purchases` table | Migration |
| Create `decrement_user_credits` function | Migration |
| RLS policies for `user_purchases` | Migration |

---

## Technical Details

### Edge Function: purchase-item

```text
Flow:
1. Parse JWT, extract userId
2. Parse request body for itemId
3. Lookup item in SHOP_ITEMS constant (same as shopItems.ts)
4. Query user_purchases for existing ownership
5. Query user_credits for current balance
6. If balance < price: return error
7. Call decrement_user_credits RPC
8. Insert into user_purchases
9. Return { success: true, newBalance, item }
```

### Frontend Purchase Flow

```text
User clicks "Unlock" button
    ↓
Show confirmation dialog: "Spend X credits on Item?"
    ↓
User confirms
    ↓
Call supabase.functions.invoke('purchase-item', { itemId })
    ↓
On success: Show toast, update UI, refetch purchases & credits
    ↓
On error: Show error toast with message
```

### UI States for Each Item

```text
┌─────────────────────────────────────────────┐
│ Item Card States:                           │
│                                             │
│ 1. OWNED: Green "Owned ✓" badge, no button  │
│ 2. CAN_BUY: "Unlock for X credits" button   │
│ 3. TOO_EXPENSIVE: Grayed button, tooltip    │
└─────────────────────────────────────────────┘
```

