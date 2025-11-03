# Button Not Working? Clear Browser Cache!

Since this is a static HTML/JS app (not a dev server), the browser caches the JavaScript files.

## Quick Fix:

### Hard Refresh Your Browser:

**Mac:**
- Chrome/Edge: `Cmd + Shift + R`
- Safari: `Cmd + Option + R`
- Firefox: `Cmd + Shift + R`

**Windows/Linux:**
- Chrome/Edge: `Ctrl + Shift + R` or `Ctrl + F5`
- Firefox: `Ctrl + Shift + R` or `Ctrl + F5`

### Or Clear Cache Manually:

1. Open DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

### If Still Not Working:

1. Open DevTools Console (F12 → Console)
2. Check for errors (red messages)
3. Try typing: `location.reload(true)` in console
4. Or close tab and reopen fresh

The code changes are saved - your browser just needs to load the new JavaScript!

