# Auth0 Initialization Troubleshooting

## Issue: "Failed to initialize authentication. Please refresh the page."

This error occurs when the Auth0 SDK fails to initialize. Here's how to diagnose and fix it.

### ✅ What Was Fixed

The original code had these issues:
1. **Environment variables used in browser** - `process.env` doesn't work in the browser
2. **Asynchronous SDK loading** - Code was trying to use Auth0 SDK before it loaded
3. **No error details** - Generic error message didn't show what was wrong

### ✅ Solution Applied

Updated code now:
1. ✅ Properly loads Auth0 SDK asynchronously
2. ✅ Waits for SDK to be available before using it
3. ✅ Validates configuration before initializing
4. ✅ Provides detailed error messages in console

---

## Debugging Steps

### Step 1: Check Browser Console
1. Open your site
2. Press `F12` or right-click → Inspect
3. Go to **Console** tab
4. Click "Sign In with Auth0"
5. Look for error messages

### Step 2: Common Errors & Solutions

#### Error: "Auth0 configuration missing"
```
Solution: 
- Make sure AUTH0_DOMAIN and AUTH0_CLIENT_ID environment 
  variables are set in Netlify
- For local testing, create .env file with these values
- Restart your dev server
```

#### Error: "Auth0 SDK not loaded"
```
Solution:
- Refresh the page
- Check network tab to ensure auth0-spa-js CDN script loaded
- Clear browser cache and reload
- Try a different browser
```

#### Error: "Auth0 Client ID not configured"
```
Solution:
- Add AUTH0_CLIENT_ID to Netlify environment variables
- Value should be from your Auth0 Application settings
- Make sure there are no extra spaces or quotes
```

### Step 3: Check Netlify Environment Variables

1. Go to Netlify Dashboard
2. Select your site
3. Go to **Site Settings → Build & Deploy → Environment**
4. Verify these are set:
   - `AUTH0_DOMAIN` - e.g., `auctus.auth0.com`
   - `AUTH0_CLIENT_ID` - e.g., `abc123...`
   - `AUTH0_CLIENT_SECRET` - e.g., `xyz789...`
   - `AUTH0_AUDIENCE` - e.g., `auctus-api`

### Step 4: Verify Auth0 Application

1. Go to Auth0 Dashboard (https://manage.auth0.com/)
2. Go to **Applications → Your App**
3. Check **Settings** tab:
   - Copy **Domain** → Should match `AUTH0_DOMAIN`
   - Copy **Client ID** → Should match `AUTH0_CLIENT_ID`
   - Copy **Client Secret** → Should match `AUTH0_CLIENT_SECRET`

### Step 5: Check Callback URLs

1. In Auth0 Application Settings
2. Scroll to **Application URIs**
3. Verify these are set correctly:
   ```
   Allowed Callback URLs:
   https://your-site.netlify.app
   http://localhost:8888
   
   Allowed Logout URLs:
   https://your-site.netlify.app
   http://localhost:8888
   
   Allowed Web Origins:
   https://your-site.netlify.app
   http://localhost:8888
   ```

---

## Testing Locally

### Local Development Setup

1. **Create `.env` file** in your project root:
   ```
   AUTH0_DOMAIN=your-auth0-domain
   AUTH0_CLIENT_ID=your-client-id
   AUTH0_CLIENT_SECRET=your-client-secret
   AUTH0_AUDIENCE=auctus-api
   NEON_DATABASE_URL=your-neon-connection
   ```

2. **Make sure `.env` is in `.gitignore`:**
   ```bash
   echo ".env" >> .gitignore
   ```

3. **Install Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

4. **Run local dev server:**
   ```bash
   netlify dev
   ```

5. **Visit:** `http://localhost:8888`

### Browser Console Debugging

When you see the error, check the console for detailed messages:

```javascript
// Look for these in the console:
// ✅ Good output:
"Auth0 Domain: auctus.auth0.com"
"Auth0 Client ID: abc123xyz"
"Auth0 SDK loaded: true"

// ❌ Bad output (fix these):
"Auth0 Domain: YOUR_AUTH0_DOMAIN"  
  → Domain not set! Add to env vars
"Auth0 Client ID: YOUR_AUTH0_CLIENT_ID"  
  → Client ID not set! Add to env vars
"Auth0 SDK loaded: false"  
  → SDK failed to load, check network
```

---

## Network Debugging

### Check if Auth0 SDK is Loading

1. Open **DevTools → Network** tab
2. Filter by typing: `auth0`
3. Look for: `auth0-spa-js/2.0/auth0-spa-js.production.js`
4. Check status:
   - ✅ **Status 200** = Script loaded successfully
   - ❌ **Status 404** = Script not found (CDN issue)
   - ❌ **Blocked** = Browser or firewall blocked it

### Check Auth0 API Calls

1. In Network tab, filter by: `auth0.com`
2. Look for requests to your Auth0 domain
3. Check status codes:
   - ✅ **Status 200/204** = Success
   - ❌ **Status 401** = Invalid credentials
   - ❌ **Status 403** = Not allowed

---

## Fix Checklist

- [ ] Netlify environment variables set correctly
- [ ] Environment variables have no extra spaces or quotes
- [ ] Auth0 Domain matches between Auth0 and Netlify
- [ ] Auth0 Client ID matches between Auth0 and Netlify
- [ ] Auth0 Client Secret is set in Netlify (not in code!)
- [ ] Callback URLs in Auth0 match your site URL
- [ ] Redeployed after changing environment variables
- [ ] Cleared browser cache
- [ ] Tested in incognito/private mode
- [ ] Checked browser console for errors
- [ ] Checked Network tab for failed requests
- [ ] Auth0 SDK script loading (status 200)

---

## Still Not Working?

### Get Help

1. **Check console errors** - Press F12, copy exact error message
2. **Check Netlify function logs** - In Netlify Dashboard → Functions → Logs
3. **Verify all environment variables** - They might have been reset
4. **Try redeploying** - Netlify sometimes needs fresh deploy
5. **Clear cache** - `Ctrl+Shift+Delete` or `Cmd+Shift+Delete`

### Common Mistakes

❌ **Using `process.env` in browser code** - Browser can't access Node env vars  
❌ **Forgetting to redeploy after env changes** - Changes need redeploy to take effect  
❌ **Hardcoding values instead of using env vars** - Security risk!  
❌ **Wrong Auth0 domain** - Check exactly what's in Auth0 settings  
❌ **Trailing spaces in env variables** - Netlify trims, but double-check  

---

## What The Code Does Now

### auth0-config.js
```javascript
1. Waits for page to load (DOMContentLoaded)
2. Loads Auth0 SDK from CDN
3. Validates Auth0 SDK is available
4. Initializes Auth0 configuration
5. Calls initializeAuth0() from auth.js
6. Shows detailed errors if anything fails
```

### auth.js
```javascript
1. Checks if Auth0 SDK is loaded
2. Validates AUTH0_DOMAIN is not the default placeholder
3. Validates AUTH0_CLIENT_ID is not the default placeholder
4. Creates Auth0 client with proper config
5. Handles redirects from Auth0
6. Shows specific error messages for each failure
```

---

## After Fix

Once this is working:

1. ✅ "Sign In with Auth0" button will be clickable
2. ✅ Clicking it will redirect to Auth0 login page
3. ✅ After login, you'll be redirected back
4. ✅ You'll be logged in and redirected to dashboard
5. ✅ No more "Failed to initialize" error

---

## Next Steps

If you're still getting errors:

1. **Report the exact error message** from the browser console
2. **Include environment variable names** (not values) you've set
3. **Describe what you see** when you click the button
4. **Check:** Is the button clickable or greyed out?

---

**This fix ensures Auth0 SDK loads properly before the app tries to use it!**
