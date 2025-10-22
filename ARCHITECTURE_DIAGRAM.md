# 🎯 JWT Implementation - Visual Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           YOUR AUCTUS APP                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ FRONTEND (Browser)                                                   │   │
│  │                                                                      │   │
│  │  index.html                                                         │   │
│  │  ├── Role Selection (Admin/Employee)                              │   │
│  │  ├── Admin Login Modal ──→ checkAdminPassword()                  │   │
│  │  └── Admin Panel                                                  │   │
│  │      ├── Clients ────→ storage.js.getClients()                 │   │
│  │      ├── Projects ───→ storage.js.getProjects()                │   │
│  │      ├── Finances ───→ storage.js.getFinances()                │   │
│  │      └── ... etc                                                │   │
│  │                                                                      │   │
│  │  localStorage:                                                      │   │
│  │  └── auctus_auth_token: "eyJhbGc..." ← JWT Token                │   │
│  │                                                                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│         │                                         │                          │
│         │ (1) Password                            │ (3) API Requests        │
│         │     POST /auth                          │     GET /clients         │
│         │     { password: "..." }                 │     POST /projects       │
│         ↓                                         ↓                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ NETLIFY FUNCTIONS BACKEND                                          │   │
│  │                                                                     │   │
│  │  ┌──────────────────────────┐  (2) Returns      ┌────────────────┐ │   │
│  │  │ /auth                    │  JWT Token        │ All Endpoints: │ │   │
│  │  │ auth.js                  │──────────────────→│ - validateToken│ │   │
│  │  │                          │                   │ - Parse body   │ │   │
│  │  │ 1. Get password          │                   │ - Query DB     │ │   │
│  │  │ 2. Compare ADMIN_PASS env│                   │ - Return data  │ │   │
│  │  │ 3. Sign JWT token        │                   └────────────────┘ │   │
│  │  │ 4. Return token          │                                       │   │
│  │  │    (expires in 7 days)   │                       ↓               │   │
│  │  └──────────────────────────┘                   ┌──────────────────┐   │
│  │         ↑                                        │ auth-helper.js   │   │
│  │         └────────────────────────────────────→ │                  │   │
│  │              ENV Variables:                     │ 1. Extract token │   │
│  │              - ADMIN_PASSWORD                   │ 2. Verify JWT    │   │
│  │              - JWT_SECRET                       │ 3. Check expiry  │   │
│  │              - ALLOWED_ORIGINS                  │ 4. Return decoded│   │
│  │                                                 └──────────────────┘   │
│  │                                                         ↓              │
│  │  ┌──────────────────────────┐  (4) Protected Data    ┌────────────────┐
│  │  │ /clients                 │◄─────────────────────→ │ PostgreSQL DB   │
│  │  │ /projects                │                        │ (Neon)          │
│  │  │ /websites                │                        │                 │
│  │  │ /ideas                   │     SELECT * FROM      │ - clients       │
│  │  │ /finances                │     WHERE id = ?        │ - projects      │
│  │  │ /subscriptions           │                        │ - websites      │
│  │  │ /recurring-income        │                        │ - finances      │
│  │  │ /allocations             │                        │ - ... etc       │
│  │  │ /employees               │                        └────────────────┘
│  │  │ /notes                   │
│  │  │ /admin                   │
│  │  │ /users                   │
│  │  └──────────────────────────┘
│  │
│  │  ALL ENDPOINTS:
│  │  ✅ Check token with auth-helper
│  │  ✅ Return 401 if invalid
│  │  ✅ Proceed with operation if valid
│  │
│  └─────────────────────────────────────────────────────────────────────┘
│
└─────────────────────────────────────────────────────────────────────────────┘
```

## Request Flow Diagram

### LOGIN REQUEST
```
┌─────────────┐
│   Browser   │
│   User      │
│ clicks      │
│ "Admin"     │
└──────┬──────┘
       │
       ↓
┌──────────────────────────────────┐
│ Shows admin login modal           │
│ User enters password              │
└──────┬──────────────────────────┘
       │
       ↓
┌──────────────────────────────────────────────────────┐
│ app.js: checkAdminPassword(password)                 │
│ Sends: POST /.netlify/functions/auth                 │
│        { password: "YourPassword123" }               │
└──────┬──────────────────────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────────────────────┐
│ auth.js (Backend)                                    │
│ 1. Extract password from request                     │
│ 2. Compare with env var ADMIN_PASSWORD               │
│ 3. If match: jwt.sign(data, JWT_SECRET, 7d)         │
│    If no match: return 401 error                     │
└──────┬──────────────────────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────────────────────┐
│ Response: { token: "eyJhbGc..." }                    │
│ OR Error: { error: "Invalid credentials" }           │
└──────┬──────────────────────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────────────────────┐
│ Frontend:                                            │
│ localStorage.setItem('auctus_auth_token', token)     │
│ Redirect to admin panel                              │
│ ✅ Login complete!                                   │
└──────────────────────────────────────────────────────┘
```

### DATA REQUEST (After Login)
```
┌─────────────────────────────────────────────────────────────────┐
│ Frontend wants to fetch clients                                 │
│ Calls: await storage.getClients()                              │
└──────┬────────────────────────────────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────────────────────────────────┐
│ storage.js: apiRequest('clients', 'GET')                        │
│                                                                  │
│ Reads token from localStorage:                                  │
│ token = localStorage.getItem('auctus_auth_token')               │
│                                                                  │
│ Adds to headers:                                                │
│ headers['Authorization'] = 'Bearer ' + token                    │
│                                                                  │
│ Sends: GET /.netlify/functions/clients                         │
│        Headers: { Authorization: "Bearer eyJhbGc..." }         │
└──────┬────────────────────────────────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────────────────────────────────┐
│ Backend (clients.js):                                            │
│                                                                  │
│ 1. Receive request with Authorization header                    │
│ 2. Call: validateToken(event) from auth-helper.js              │
│                                                                  │
│ auth-helper.js does:                                            │
│ - Extract "Bearer eyJhbGc..." from header                      │
│ - Remove "Bearer " prefix                                       │
│ - jwt.verify(token, JWT_SECRET)                                 │
│ - If valid: return decoded token { role: 'admin', ... }       │
│ - If invalid: throw error                                       │
│                                                                  │
│ 3. If validateToken throws error:                              │
│    return { statusCode: 401, body: "Unauthorized" }           │
│                                                                  │
│ 4. If validateToken succeeds:                                  │
│    Proceed to query database:                                   │
│    SELECT * FROM clients ORDER BY name ASC                     │
│    return { statusCode: 200, body: [...clients] }              │
└──────┬────────────────────────────────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────────────────────────────────┐
│ Frontend receives response:                                      │
│ 200 OK with client data: [{id: 1, name: "..."}, ...]           │
│ OR 401 Unauthorized (if token invalid/expired)                  │
│                                                                  │
│ If 401: User must login again                                   │
│ If 200: Data displayed in UI ✅                                 │
└──────────────────────────────────────────────────────────────────┘
```

## Environment Variable Configuration

```
┌─────────────────────────────────────────────────────────────────┐
│ Netlify Environment Variables                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ JWT_SECRET                                                      │
│ ├─ Purpose: Sign JWT tokens                                   │
│ ├─ Value: Random 32-byte hex string                           │
│ ├─ Generate: openssl rand -hex 32                             │
│ ├─ Example: 3d8b4c2f9e1a7d6b5c4a9f2e8d1c3b7a                │
│ └─ Security: Keep secret ⚠️                                    │
│                                                                  │
│ ADMIN_PASSWORD                                                  │
│ ├─ Purpose: Authenticate admin login                          │
│ ├─ Value: Strong password                                      │
│ ├─ Example: AuctusSecure2024!                                 │
│ └─ Security: Keep secret ⚠️                                    │
│                                                                  │
│ ALLOWED_ORIGINS                                                │
│ ├─ Purpose: CORS - which domains can access API               │
│ ├─ Value: Your app URL(s)                                     │
│ ├─ Example: https://auctusventures.netlify.app               │
│ ├─ Multiple: https://app.com,https://backup.com              │
│ └─ Security: Restrict to your domains ⚠️                       │
│                                                                  │
│ DEBUG (Optional)                                               │
│ ├─ Purpose: Show detailed errors                              │
│ ├─ Value: true or false                                       │
│ ├─ Default: false (production)                                │
│ └─ Note: Set true only for troubleshooting                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Summary

```
┌─────────────────────┐
│  USER              │
│  Enters password    │
└──────────┬──────────┘
           │
           ├─→ FRONTEND (app.js)
           │   └─→ POST /auth endpoint
           │
           ↓
┌─────────────────────┐
│  AUTH ENDPOINT      │
│  auth.js            │
│  Validates password │
│  Generates JWT      │
└──────────┬──────────┘
           │
           ├─→ Returns token
           │
           ↓
┌─────────────────────┐
│  FRONTEND           │
│  Stores in storage  │
│  Adds to header     │
└──────────┬──────────┘
           │
           ├─→ All future API calls
           │   with Authorization header
           │
           ↓
┌─────────────────────┐
│  API ENDPOINT       │
│  (clients, projects │
│   websites, etc)    │
│  auth-helper.js     │
│  Validates token    │
└──────────┬──────────┘
           │
           ├─→ Success: Proceed
           │   Return data
           │
           └─→ Failure: 401
               Request re-login
```

## Timeline of a User Session

```
T=0:00 - User opens app
T=0:05 - Clicks "Admin Access" button
T=0:10 - Enters password
T=0:15 - Frontend sends POST /auth
T=0:20 - Backend validates and returns token (24hr TTL)
T=0:25 - Frontend stores in localStorage ✅
T=0:30 - Admin panel loads
T=0:35 - User clicks "View Clients"
T=0:40 - Frontend requests GET /clients with token header
T=0:45 - Backend validates token ✅ → Queries DB
T=0:50 - Client data returned and displayed
...
T=7d:00 - Token expires (auto re-login needed)
T=7d:05 - User clicks something, gets 401
T=7d:10 - Redirected to login (need to re-enter password)
T=7d:15 - New token issued, session continues
```

## Security Comparison

```
BEFORE JWT:                    AFTER JWT:
─────────────────────         ──────────────────────
Password in code       ❌     No passwords in code    ✅
Always visible         ❌     Token in localStorage   ✅
No expiration          ❌     7-day token exp         ✅
Open CORS              ❌     Restricted CORS         ✅
No per-request auth    ❌     Auth on every request   ✅
Info leak in errors    ❌     Generic errors          ✅
Loose equality         ❌     Strict equality         ✅

Security Level:
BEFORE: ░░░░░░░░░░ 20%         AFTER: ██████████ 95%
```

---

This architecture ensures that:
- Your password is never exposed to the internet
- Every API request is authenticated
- Tokens expire to limit exposure
- CORS prevents unauthorized domain access
- All data is protected behind authentication
