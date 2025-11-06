# State Synchronization Testing Guide

## Bug Fix: State Consistency Between Mobile and Desktop Views

### What Was Fixed

1. **Storage Event Listener**: Added cross-tab/view synchronization for:
   - Advisors list and their active states
   - Current session messages
   - Advisor groups
   - Settings (reasoning mode, sidebar, tokens, etc.)

2. **Debounced Persistence**: Prevents race conditions by:
   - Debouncing advisor state writes by 500ms
   - Debouncing advisor group writes by 500ms
   - Only persisting after initialization completes

3. **State Hydration**: Already implemented via `isInitializing` flag:
   - Shows loading screen until localStorage is fully read
   - Prevents rendering before state is ready

4. **Debug Logging**: When debug mode is enabled (`/debug`):
   - Logs all storage events
   - Logs state persistence operations
   - Logs state snapshots every 10 seconds
   - Tracks mobile vs desktop state

### How to Test

#### Test 1: Mobile/Desktop View Switching
1. Open the app in desktop view
2. Create or activate 2-3 advisors
3. Send a message and get responses
4. Switch to mobile view (resize browser to < 768px width)
5. **Expected**: All advisors, messages, and settings should be identical
6. In mobile view, toggle an advisor on/off
7. Switch back to desktop view
8. **Expected**: Advisor state should match mobile changes

#### Test 2: Cross-Tab Synchronization
1. Open the app in two browser tabs (Tab A and Tab B)
2. In Tab A, add a new advisor
3. **Expected**: Tab B should immediately show the new advisor
4. In Tab B, activate/deactivate an advisor
5. **Expected**: Tab A should reflect the change
6. In Tab A, send a message
7. **Expected**: Tab B should show the new message after refresh or tab switch

#### Test 3: Settings Synchronization
1. Open two tabs
2. In Tab A, change max tokens in settings
3. **Expected**: Tab B should reflect the change
4. In Tab B, toggle reasoning mode
5. **Expected**: Tab A should update
6. Resize one tab to mobile view
7. Change paragraph spacing
8. **Expected**: Other tab should sync the change

#### Test 4: Debug Mode Testing
1. Type `/debug` in the terminal to enable debug mode
2. Open browser console (F12)
3. Perform actions (add advisor, toggle advisor, send message)
4. **Expected Debug Logs**:
   - `[State Sync] Advisors persisted to localStorage`
   - `[State Sync] Current state snapshot` (every 10 seconds)
   - State snapshots should show:
     - Current advisor count
     - Active advisors list
     - Message count
     - Session ID
     - Whether view is mobile or desktop

5. Open a second tab and make changes
6. **Expected**: First tab's console should show:
   - `[State Sync] Storage event detected`
   - `[State Sync] Advisors updated from storage`

#### Test 5: Race Condition Prevention
1. Open the app
2. Immediately start toggling advisors rapidly (click multiple advisors quickly)
3. **Expected**: 
   - No duplicate advisors
   - No lost advisor states
   - Console should show debounced writes (not immediate writes)
4. Refresh the page
5. **Expected**: All advisor states should be preserved correctly

#### Test 6: Session Persistence
1. Open two tabs to the same session
2. In Tab A, send a message and receive a response
3. In Tab B, refresh the page
4. **Expected**: Tab B should load with the latest messages
5. In Tab B, make a change to the session
6. **Expected**: Tab A should sync (may require tab focus/visibility change)

### Known Limitations

1. **Storage Event Limitation**: The storage event only fires in **other** tabs, not the tab that made the change. This is by design in the browser API.
   - Within the same tab, state updates happen immediately via React state
   - Across tabs, updates happen via storage events

2. **Mobile Component Remounting**: If the responsive system uses separate routes instead of CSS media queries, components may remount. The hydration system prevents state loss during remounts.

3. **Database Mode**: In authenticated mode with database storage, localStorage is only used for settings, not messages/sessions. This is working as intended.

### Troubleshooting

**Problem**: Changes in one tab don't appear in another tab
- **Solution**: Make sure both tabs are on the same browser (storage events don't cross browsers)
- Check that both tabs are using the same domain (localhost vs 127.0.0.1 are different)
- Enable debug mode and check console for storage events

**Problem**: State resets when switching mobile/desktop views
- **Solution**: Verify the responsive system uses CSS media queries, not separate routes
- Check browser console for hydration errors
- Enable debug mode to track state changes

**Problem**: Advisors duplicated or lost
- **Solution**: This should be fixed by debouncing. Check console for errors
- Clear localStorage and start fresh: `localStorage.clear()` in console
- Report the issue with browser console logs

### Code Changes Summary

**File**: `src/components/Terminal.jsx`

**Added** (after line 778):
1. Storage event listener (~84 lines)
2. Debounced advisor persistence (~18 lines)
3. Debounced advisor group persistence (~15 lines)
4. Debug logging for state tracking (~17 lines)

**Total**: ~134 lines of new synchronization code

All changes are non-breaking and backward compatible with existing functionality.

