

# Test User Implementation Plan

## Overview

This plan creates a "test user" system that allows designated accounts to test shop items and badges without affecting leaderboards or player statistics. Test users can purchase items, earn badges, and play the game normally, but their data is filtered out from all public-facing statistics.

---

## Approach

The cleanest approach is to add an `is_test_user` boolean flag to the `profiles` table. This flag will be used to:
1. Exclude test users from the leaderboard
2. Exclude test users from ranking calculations (total players count, rank by best/average)
3. Still allow test users to fully interact with badges, shop, and game mechanics

---

## Database Changes

### Step 1: Add is_test_user Column to Profiles

Add a new column to the `profiles` table:
- `is_test_user` (boolean, default FALSE, not null)

This ensures existing users are not affected and new users default to regular players.

### Step 2: Update get_leaderboard Function

Modify the `get_leaderboard` database function to exclude users where `is_test_user = TRUE`:

```text
Current behavior: Returns all players
New behavior: Filters out profiles.is_test_user = TRUE
```

### Step 3: Update get_player_rankings Function

Modify the `get_player_rankings` function to:
- Exclude test users from total player count
- Exclude test users from ranking calculations (so regular users' ranks aren't affected by test data)

---

## How to Mark a User as Test User

Since there's no admin UI, test users will be marked directly in the database:

1. Create a regular account (e.g., `test@example.com`)
2. Set their profile's `is_test_user` flag to TRUE via a SQL query

This is a one-time setup that can be done through the Cloud View > Run SQL feature.

---

## Technical Implementation Details

### Migration SQL

```text
-- Add is_test_user column to profiles
ALTER TABLE profiles 
ADD COLUMN is_test_user BOOLEAN NOT NULL DEFAULT FALSE;

-- Update get_leaderboard to exclude test users
CREATE OR REPLACE FUNCTION public.get_leaderboard(
  p_sort_by text DEFAULT 'best',
  p_limit integer DEFAULT 50
)
RETURNS TABLE(...)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validate inputs (existing logic)
  
  -- Add JOIN to profiles and filter is_test_user = FALSE
  RETURN QUERY
  SELECT ...
  FROM game_records gr
  LEFT JOIN profiles p ON gr.user_id = p.user_id
  WHERE gr.user_id IS NOT NULL
    AND (p.is_test_user IS NULL OR p.is_test_user = FALSE)
  ...
END;
$$

-- Update get_player_rankings to exclude test users
CREATE OR REPLACE FUNCTION public.get_player_rankings(p_user_id uuid)
RETURNS TABLE(...)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Filter out test users from rankings and total counts
  ...
  WHERE (p.is_test_user IS NULL OR p.is_test_user = FALSE)
  ...
END;
$$
```

### Edge Cases Handled

1. **Profiles without is_test_user set**: Uses `IS NULL OR = FALSE` to handle both cases
2. **Game records without profiles**: Uses LEFT JOIN so games from users without profiles still work
3. **Test user viewing their own rank**: They can still see their stats, but they won't appear in public leaderboard

---

## What Test Users CAN Do

- Play the daily game
- Earn badges and credits
- Purchase shop items
- Use dice skins and actions
- View their own stats and ranks (personal stats still work)

## What Test Users CANNOT Affect

- Public leaderboard (excluded)
- Other users' ranking positions (not counted in rankings)
- Total player count in statistics

---

## File Changes Summary

| Type | Target | Changes |
|------|--------|---------|
| Migration | Database | Add `is_test_user` column to `profiles` |
| Migration | Database | Update `get_leaderboard` function |
| Migration | Database | Update `get_player_rankings` function |

---

## Post-Implementation: Creating a Test User

After the migration is applied, mark any user as a test user with this SQL:

```text
UPDATE profiles 
SET is_test_user = TRUE 
WHERE username = 'your_test_username';
```

Or by user email (requires joining with auth.users, run via Cloud View):

```text
UPDATE profiles 
SET is_test_user = TRUE 
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'test@example.com'
);
```

---

## Security Considerations

- The `is_test_user` column is not exposed to clients (no frontend changes needed)
- Only database admins can modify this flag
- Test users have no special privileges - they just get filtered from public stats
- RLS policies remain unchanged

