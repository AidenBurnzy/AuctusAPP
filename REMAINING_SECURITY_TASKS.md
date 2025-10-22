# Remaining Security Tasks

## Current Status: 4 of 6 vulnerabilities fixed ✅

All **P0 Critical** vulnerabilities have been remediated. Ready for production deployment after environment setup.

---

## ⏳ Task 5: Improve Token Storage Security

**Priority:** P1 (High) - Implement after deploying XSS fixes
**Effort:** 2-3 hours
**Files:** `js/app.js`, `js/storage.js`

### Current Approach (Vulnerable to XSS)
```javascript
// Stores JWT in localStorage - accessible to JavaScript
localStorage.setItem('auctus_auth_token', jwtToken);

// Replayed on every request
const token = localStorage.getItem('auctus_auth_token');
headers['Authorization'] = `Bearer ${token}`;
```

### Recommended Approach (More Secure)
```javascript
// 1. Short-lived tokens (15-30 min expiry) in httpOnly cookies
// - Set during login in backend
// Set-Cookie: jwt_token=...; HttpOnly; Secure; SameSite=Strict; Max-Age=900

// 2. Refresh tokens (7 days) in httpOnly cookies
// Set-Cookie: refresh_token=...; HttpOnly; Secure; SameSite=Strict; Max-Age=604800

// 3. Frontend never handles tokens directly
// - Cookies automatically sent with requests
// - No localStorage storage
// - XSS cannot steal tokens
```

### Implementation Steps

**Step 1: Update Backend (netlify/functions/auth.js)**
```javascript
// When issuing token, set httpOnly cookie
response.headers = {
    'Set-Cookie': `jwt_token=${jwtToken}; HttpOnly; Secure; SameSite=Strict; Max-Age=900; Path=/`
};
```

**Step 2: Update Frontend (js/app.js)**
```javascript
// Remove localStorage token storage
// Cookies are sent automatically by browser
// No need for Authorization header in most cases
```

**Step 3: Update Fetch Requests (js/storage.js)**
```javascript
// Before
const options = {
    headers: {
        'Authorization': `Bearer ${localStorage.getItem('auctus_auth_token')}`
    }
};

// After - cookies sent automatically
const options = {
    credentials: 'include' // Important: tell fetch to send cookies
};
```

### Testing
```javascript
// Test that cookies are secure
// Open DevTools → Application → Cookies
// Verify: HttpOnly checkbox is checked
// Verify: Secure checkbox is checked (HTTPS only)
```

---

## ⏳ Task 6: Clarify Auth0 Token Validation

**Priority:** P1 (High) - Needs user clarification
**Effort:** Depends on decision (1-2 hours for implementation)

### Current Implementation
```javascript
// validateToken() expects HS256 with shared secret
function validateToken(token) {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
        return !!decoded;
    } catch (err) {
        return false;
    }
}
```

### The Issue
- Auth0-issued tokens use RS256 (public key cryptography)
- Cannot verify RS256 tokens with HS256 (shared secret)
- Currently, Auth0 signup flow may not work properly

### Decision Tree

**Question 1: Do you want to support Auth0 login?**

#### Answer: YES - Support Auth0 Login
```javascript
// Need to verify tokens against Auth0 JWKS endpoint
// Implementation:
const axios = require('axios');
const { JwksClient } = require('jwks-rsa');

const jwksClient = new JwksClient({
    jwksUri: `https://${AUTH0_DOMAIN}/.well-known/jwks.json`
});

async function validateAuth0Token(token) {
    try {
        const decoded = jwt.decode(token, { complete: true });
        const key = await jwksClient.getSigningKey(decoded.header.kid);
        const verified = jwt.verify(token, key.getPublicKey());
        return !!verified;
    } catch (err) {
        return false;
    }
}
```

**Changes Needed:**
1. Add `jwks-rsa` package: `npm install jwks-rsa`
2. Update `netlify/functions/auth-helper.js` to support RS256
3. Create separate validation for Auth0 vs internal JWT
4. Update `package.json` dependencies

#### Answer: NO - Remove Auth0 Signup
```javascript
// Remove Auth0 entirely
// Delete: js/auth0-config.js
// Delete: js/signup.js
// Update: js/app.js (remove Auth0 references)
// Update: index.html (remove Auth0 script)
// Result: Only internal JWT login/signup

// Benefits:
// - Simpler codebase
// - One authentication method
// - Lower external dependencies
// - Easier security review
```

**Changes Needed:**
1. Remove Auth0 signup form from UI
2. Simplify login to only JWT path
3. Remove Auth0 libraries
4. Update signup flow to be internal-only

---

## Timeline Recommendation

```
Week 1: Deploy XSS + Role Escalation + db-init fixes ✅
   → Perform security testing
   → Verify all P0 vulnerabilities resolved

Week 2: Make Auth0 Decision
   Option A: Remove Auth0 (simpler)
      → Remove Auth0 code and dependencies
   Option B: Support Auth0 (more features)
      → Implement RS256 verification against JWKS
      → Test Auth0 login flow

Week 3: Implement Token Storage Security
   → Migrate to httpOnly cookies
   → Implement refresh token logic
   → Test token lifecycle

Week 4: Production Deployment
   → Load testing
   → Final security audit
   → Set environment variables
   → Deploy to production
```

---

## Decision Points for User

**Please confirm:**

1. **Auth0 Support:**
   - [ ] YES - Keep and properly support Auth0 signup
   - [ ] NO - Remove Auth0, only support internal JWT

2. **Token Storage Timeline:**
   - [ ] Implement immediately (same sprint as XSS fixes)
   - [ ] Implement later (separate sprint)

3. **Deployment Target:**
   - Staging environment first?
   - Direct to production?
   - Specific timeline?

---

## Environment Variables Needed Before Deployment

```bash
# JWT Configuration
JWT_SECRET=<randomly generated 32-char string>
JWT_EXPIRY=7d

# Admin Setup
ADMIN_PASSWORD=<secure password>

# Database Initialization (set to false in production)
DB_INIT_ENABLED=false
ALLOWED_ORIGINS=https://yourdomain.com

# Auth0 (if supporting Auth0)
AUTH0_DOMAIN=your-domain.auth0.com
AUTH0_CLIENT_ID=your_client_id
AUTH0_CLIENT_SECRET=your_client_secret

# Deployment
ENVIRONMENT=production
DATABASE_URL=<neon_database_url>
```

---

## Quick Verification Checklist

```
☑ Generate JWT_SECRET:
  openssl rand -base64 32

☑ All XSS tests pass (no alerts for malicious input)

☑ Role escalation test:
  - Create user via API
  - Attempt to set role='admin' in request
  - Verify stays as 'user'

☑ db-init secured:
  - Without auth header → 401
  - With auth but DB_INIT_ENABLED=false → 403
  - With auth and DB_INIT_ENABLED=true → Success

☑ No errors in browser console

☑ All modals work without inline onclick handlers

☑ All list views display correctly
```
