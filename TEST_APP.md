# FirePlanning App - Manual Testing Guide

## Quick Start
1. Open http://localhost:5173/ in your browser
2. The app should automatically show the "Calendrier individuel" (Individual Calendar) page
3. Create at least one firefighter (or import data) before testing calendar interactions

## What to Test

### 1. Page Load
- [ ] App loads without errors (check browser console with F12)
- [ ] You see "Calendrier individuel (édition des absences)" title
- [ ] Dropdown shows the firefighters you created/imported

### 2. Single Click (30-min absence)
- [ ] Select a firefighter from the dropdown
- [ ] Click on any time slot in the calendar
- [ ] A red block should appear (absence)
- [ ] The red block should say "Absent"

### 3. Drag (Multi-slot absence)
- [ ] Click and hold on a time slot
- [ ] Drag down or up to select multiple slots
- [ ] Release
- [ ] A red block covering multiple slots should appear

### 4. Click Red Block (Delete)
- [ ] Click on the red absence block
- [ ] It should disappear

### 5. Calendar Navigation
- [ ] "Aujourd'hui" (Today) button works
- [ ] "Précédent" (Previous) changes day backwards
- [ ] "Suivant" (Next) changes day forwards
- [ ] Date picker works

## Browser Console Check
Open browser console (F12) and look for:
- [ ] No JavaScript errors (red X)
- [ ] No JavaScript errors related to initialization

## If Something is Broken
1. Check browser console (F12) for red errors
2. Note the exact action that fails
3. Check if it affects all firefighters or just one
