# JWT Token Authentication Fix

## Problem Summary
After the security hardening phase, admin login and database queries were failing because:

1. **No JWT token was being generated** - The admin login process only stored a local auth state but never called the auth endpoint to get a JWT token
2. **No Authorization header in API requests** - The `storage.js` file never included the JWT token in API requests, so all calls to Netlify Functions were rejected with 401 errors

## Root Causes

### Issue 1: Missing Token Generation in Admin Login
**File**: `js/app.js`  
**Function**: `checkAdminPassword()`

**Before**: 
```javascript
checkAdminPassword(password) {
    if (password === this.adminPassword) {
        this.isAuthenticated = true;
        this.userRole = 'admin';
        localStorage.setItem('auctus_auth', JSON.stringify({
            isAuthenticated: true,
            role: 'admin'
        }));
        // ... rest of code
    }
}
```

**Problem**: No JWT token was ever obtained. The frontend had a hardcoded password, but this doesn't match the backend's auth endpoint which expects to verify credentials and return a JWT.

### Issue 2: Missing Authorization Header in API Requests
**File**: `js/storage.js`  
**Function**: `apiRequest()`

**Before**:
```javascript
async apiRequest(endpoint, method = 'GET', data = null) {
    const options = {
        method,
        headers: { 'Content-Type': 'application/json' }
        // ❌ No Authorization header
    };
    // ... fetch request without token
}
```

**Problem**: All Netlify Functions require authentication via JWT token in the `Authorization: Bearer <token>` header. Without this, every API call failed with 401 Unauthorized.

## Solutions Implemented

### Fix 1: Generate JWT Token on Admin Login
**File**: `js/app.js`  
**Function**: `checkAdminPassword()` - Now `async`

```javascript
async checkAdminPassword(password) {
    try {
        // Call the auth endpoint to get JWT token
        const response = await fetch('/.netlify/functions/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });

        if (!response.ok) {
            // Show error and return
            document.getElementById('password-error').style.display = 'block';
            return false;
        }

        const data = await response.json();
        
        // ✅ Store JWT token
        localStorage.setItem('auctus_token', data.token);
        localStorage.setItem('auctus_auth', JSON.stringify({
            isAuthenticated: true,
            role: 'admin'
        }));
        
        this.isAuthenticated = true;
        this.userRole = 'admin';
        this.closeAdminLogin();
        this.showAdminPanel();
        return true;
    } catch (error) {
        console.error('Authentication error:', error);
        // Show error and return
        return false;
    }
}
```

**Key changes**:
- Now calls `/.netlify/functions/auth` endpoint (requires `ADMIN_PASSWORD` env var set on Netlify)
- Stores the JWT token in localStorage with key `auctus_token`
- Made function async to handle the fetch call
- Improved error handling with user feedback

### Fix 2: Include JWT Token in All API Requests
**File**: `js/storage.js`  
**Function**: `apiRequest()`

```javascript
async apiRequest(endpoint, method = 'GET', data = null) {
    const url = `${this.API_BASE}/${endpoint}`;
    try {
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' }
        };
        
        // ✅ Add JWT token to Authorization header
        const token = localStorage.getItem('auctus_token');
        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }
        
        if (data) {
            options.body = JSON.stringify(data);
        }
        const response = await fetch(url, options);
        // ... rest of error handling
    }
}
```

**Key changes**:
- Retrieves JWT token from localStorage before each request
- Adds `Authorization: Bearer <token>` header to all requests
- Gracefully handles missing token (won't add header if token doesn't exist)

### Fix 3: Clear Token on Logout
**File**: `js/app.js`  
**Function**: `logout()`

```javascript
logout() {
    this.isAuthenticated = false;
    this.userRole = null;
    localStorage.removeItem('auctus_auth');
    localStorage.removeItem('auctus_token');  // ✅ Remove token
    // ... rest of code
}
```

## Environment Variables Required

For the system to work, set these on Netlify:

```
ADMIN_PASSWORD=<your-secure-password>
JWT_SECRET=<base64-random-string>
NEON_DATABASE_URL=<your-neon-connection-string>
DB_INIT_ENABLED=false
ALLOWED_ORIGINS=https://yourdomain.netlify.app
```

Generate a secure JWT_SECRET:
```bash
openssl rand -base64 32
```

## Testing the Fix

1. **Admin Login**:
   - Enter admin password
   - Browser should call `POST /.netlify/functions/auth`
   - Token should be stored in localStorage as `auctus_token`
   - UI should show admin dashboard

2. **Data Loading**:
   - Dashboard should display clients, projects, websites, etc.
   - Check browser console to see API calls include `Authorization: Bearer <token>`
   - Data should be fetched from database without 401 errors

3. **Database Queries**:
   - All GET requests to `/api/clients`, `/api/projects`, etc. should return 200
   - Data should display in the UI
   - Create/Update/Delete operations should work

4. **Logout**:
   - Click logout button
   - Token should be removed from localStorage
   - App should show role selection screen
   - New login should generate a new token

## Token Lifespan

The JWT token generated by the auth endpoint has a **7-day expiration** (set in `netlify/functions/auth.js`):

```javascript
const token = jwt.sign(
    { 
        role: 'admin',
        iat: Math.floor(Date.now() / 1000)
    },
    JWT_SECRET,
    { expiresIn: '7d' }  // ← 7 days
);
```

After 7 days, user must re-authenticate (re-enter password).

## Related Files Modified

1. **js/app.js**
   - `checkAdminPassword()` - Now async, calls auth endpoint, stores token
   - `logout()` - Now removes token from localStorage

2. **js/storage.js**
   - `apiRequest()` - Now includes Authorization header with JWT token

3. **netlify/functions/auth.js** (already existed)
   - Validates password against `ADMIN_PASSWORD` env var
   - Generates JWT token signed with `JWT_SECRET`
   - Returns token to frontend

## Security Notes

✅ **Token Storage**: JWT token stored in localStorage (not ideal, but functional for this app)  
✅ **Token Transmission**: Token sent via secure Authorization header (not URL parameter)  
✅ **Token Validation**: Backend validates token signature with JWT_SECRET before processing any request  
✅ **Password Security**: Actual password validation happens on backend (not compared in frontend code)  

**Future Improvements** (P1 security backlog):
- Migrate token from localStorage to httpOnly cookies (prevents XSS access)
- Implement token refresh mechanism (short-lived access tokens + long-lived refresh tokens)
- Add logout-on-expiry functionality

## Deployment Checklist

- [ ] Set `ADMIN_PASSWORD` on Netlify
- [ ] Set `JWT_SECRET` on Netlify (generate with `openssl rand -base64 32`)
- [ ] Verify `NEON_DATABASE_URL` is set
- [ ] Deploy function updates: `netlify deploy --functions`
- [ ] Test admin login works
- [ ] Test data loads from database
- [ ] Test logout clears token
