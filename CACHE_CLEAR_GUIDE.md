# Cache Clear & Deployment Guide

## Version Update: October 28, 2025

### Changes Made
- ✅ Updated all version parameters from `20251019-35` to `20251028-1`
- ✅ Added cache control headers to prevent browser caching
- ✅ Updated CSS version for new button styles
- ✅ Updated JS versions for messaging system changes

### Files Updated
1. `index.html` - All script and CSS version parameters
2. `netlify.toml` - Added cache control headers
3. `_headers` - Added cache control for JS/CSS/HTML files

### Deploy Steps

1. **Commit and push all changes:**
```bash
git add .
git commit -m "Update version to 20251028-1 - messaging system and button fixes"
git push origin main
```

2. **Clear Netlify Cache (in Netlify Dashboard):**
   - Go to Netlify Dashboard → Your Site
   - Click on "Deploys" tab
   - Click "Trigger deploy" dropdown
   - Select "Clear cache and deploy site"

3. **After deployment, clear browser cache:**
   - **Chrome/Edge:** Press `Ctrl+Shift+Delete` (or `Cmd+Shift+Delete` on Mac)
   - Select "Cached images and files"
   - Click "Clear data"
   
   **OR** hard refresh:
   - `Ctrl+F5` (Windows/Linux)
   - `Cmd+Shift+R` (Mac)

4. **Test the changes:**
   - Login as admin - check Messages view
   - Login as client (Global/Test) - check Messages and Dashboard buttons
   - Verify all buttons have proper styling (not white boxes)
   - Verify iMessage-style bubbles appear in Messages

### What Should Work Now

✅ **Admin Panel:**
- Messages view with client sidebar
- iMessage-style chat bubbles
- Single textarea compose
- Action buttons with proper colors

✅ **Client Portal:**
- Dashboard "View All" buttons (purple text)
- Quick Action buttons (dark with purple icons)
- iMessage-style Messages view
- Optimistic message updates

### If Still Seeing Old Version

1. **Check the version in browser:**
   - Open browser DevTools (F12)
   - Go to Network tab
   - Refresh page
   - Look for `styles.css` and `client-portal.js` requests
   - Check if they have `?v=20251028-1` parameter
   - If not, hard refresh again

2. **Clear Service Worker:**
   - Open DevTools → Application tab
   - Click "Service Workers" on left
   - Click "Unregister" for any registered workers
   - Refresh page

3. **Incognito Mode Test:**
   - Open site in Incognito/Private browsing
   - This bypasses all cache
   - If it works here, it's definitely a caching issue

### Version History
- `20251028-1` - Messaging system complete, button fixes, cache control
- `20251019-35` - Previous version (old)
