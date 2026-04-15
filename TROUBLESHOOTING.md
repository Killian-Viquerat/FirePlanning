# Troubleshooting Guide - FirePlanning App

## If the App Doesn't Load

### Symptom: Blank white/black screen
**Solution:**
1. Open browser console (F12)
2. Look for JavaScript errors (red text)
3. If errors exist, note them and refresh the page
4. Check that http://localhost:5173/ is accessible

**If still broken:**
```bash
# Restart dev server
pkill -f vite
cd /home/killian/Project/FirePlanning
npm run dev
```

### Symptom: 404 or Connection Refused
**Solution:**
1. Check if dev server is running: `ps aux | grep vite`
2. If not, start it: `npm run dev`
3. Wait 10 seconds for it to fully start
4. Refresh browser

## If the Calendar Page Doesn't Show

### Symptom: Shows "Groupe" page instead of calendar
**Solution:**
1. The app should auto-navigate on load
2. If not, click "Calendrier individuel" button in the nav bar
3. Check browser console for errors

### Symptom: No firefighters in dropdown
**Solution:**
1. Demo data should load automatically
2. If empty, try refreshing the page
3. Check browser console for: "[Demo] Initialized data" message
4. If missing, demo initialization failed

## If Clicking/Dragging Doesn't Work

### Symptom: Click on slot doesn't create absence
**Checklist:**
- [ ] Firefighter is selected in dropdown
- [ ] Calendar page is visible
- [ ] You can see the time slots (30-min boxes)
- [ ] No error in browser console

**Solution:**
1. Refresh page (Ctrl+R)
2. Select a firefighter from dropdown
3. Try clicking a different time slot
4. Check browser console (F12) for errors

### Symptom: Drag doesn't work
**Checklist:**
- [ ] Click and HOLD (don't release immediately)
- [ ] Move mouse while holding down
- [ ] Release to create absence

**If still not working:**
1. Try clicking first (should create 30-min absence)
2. If click works, try slower drag
3. Try dragging to an adjacent slot first
4. If still no luck, check console for pointer events

## If Red Blocks Don't Appear

### Symptom: Create absence but nothing shows
**Solution:**
1. Refresh page (might be rendering issue)
2. Navigate to different day, then back to today
3. Check browser console for JavaScript errors
4. Try creating a different absence

### Symptom: Absence created but red block is wrong position
**Solution:**
1. This can happen if time zones are miscalculated
2. Try creating absence at different times of day
3. Check browser developer tools for element inspect

## If Deleting Doesn't Work

### Symptom: Click red block but it doesn't delete
**Solution:**
1. Make sure you're clicking the red block itself (not green presence)
2. Red block should show "Absent" when you hover
3. Try double-clicking
4. Check console for errors

## Emergency Reset

If app is in a bad state:

```bash
# Option 1: Clear all data and reload
# Just refresh the page - demo data will reload

# Option 2: Hard refresh (clears cache)
# Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)

# Option 3: Restart dev server
killall node
cd /home/killian/Project/FirePlanning
npm run dev

# Option 4: Full rebuild
cd /home/killian/Project/FirePlanning
rm -rf dist node_modules/.vite
npm run build
npm run dev
```

## Getting Help

When reporting an issue:
1. Open browser console (F12)
2. Take screenshot of error message
3. Note what action triggered the error
4. Provide browser version (Chrome, Firefox, Safari)

### Console Check Procedure
1. Press F12 or right-click → Inspect
2. Click "Console" tab
3. Look for red error messages
4. Copy/paste the error text

## Performance Issues

### Symptom: App is slow or unresponsive
**Solution:**
1. Close other browser tabs
2. Restart dev server
3. Try in incognito/private mode
4. Check system resources (CPU/RAM)

### Symptom: Dragging is sluggish
**Solution:**
1. Close browser dev console (F12) - it can slow things down
2. Reduce number of open tabs
3. Ensure you're on stable internet (if running remotely)

## Testing Features

See TEST_APP.md for detailed testing checklist.

## Still Not Working?

If none of these solutions work:
1. Collect all console error messages
2. Note the exact steps to reproduce
3. Check IMPLEMENTATION_SUMMARY.md for architecture
4. Verify dev server process is actually running: `ps aux | grep vite`
