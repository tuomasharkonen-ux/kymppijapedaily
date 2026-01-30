

# Fix Shake Detection for Mobile Devices

## Problem Summary

The shake detection feature isn't working because **iOS requires permission requests to be triggered by a user gesture** (like a button tap). The current code tries to request permission automatically when the component mounts, which iOS blocks silently.

## Solution Overview

Add a permission prompt that appears when the user first tries to use the Shake action feature, requesting motion sensor access through a button tap.

---

## Implementation Steps

### Step 1: Update the Shake Detection Hook

Modify `useShakeDetection.ts` to:
- Remove the automatic permission request from `useEffect`
- Only add the motion listener after permission is confirmed
- Track permission status internally
- Add a `permissionStatus` state that can be checked externally

### Step 2: Add Permission Request Flow to GameBoard

When the user has purchased and activated the Shake action:
- Check if motion permission has been granted
- If not, show a prompt or button asking them to "Enable Shake Detection"
- When they tap the button, call the permission request
- Store the result (granted/denied) in localStorage for persistence

### Step 3: Add Visual Feedback

- Show a small indicator or toast when shake detection is enabled
- If permission was denied, show a message explaining how to enable it in browser settings

---

## Technical Details

### Updated Hook API

The hook will expose:
- `permissionStatus`: 'unknown' | 'granted' | 'denied' | 'not-supported'
- `requestPermission`: Function to call on user gesture
- `isListening`: Whether the motion listener is active

### Permission Storage

Use localStorage key `shake_motion_permission` to remember:
- Whether permission was previously granted (skip re-asking)
- Whether it was denied (show instructions instead)

### UI Changes

Add a conditional banner or modal in GameBoard that appears when:
- User has Shake action enabled
- Permission hasn't been granted yet

The banner will have a button: "Enable Shake to Shake" that triggers the permission request.

---

## Files to Modify

1. **`src/hooks/useShakeDetection.ts`** - Refactor permission handling
2. **`src/components/GameBoard.tsx`** - Add permission request UI
3. **`src/components/ActionButtons.tsx`** (optional) - Show indicator for shake-enabled state

---

## Expected Outcome

After implementation:
- iOS users will see a prompt to enable shake detection
- Tapping the enable button triggers the native iOS permission dialog
- Once granted, shaking the phone will trigger the Shake action
- Android users may not need the prompt (permission granted automatically)
- Desktop users will not see the shake option at all

