# Visual Guide - Auth0 Integration

## 🗺️ Complete Flow Diagram

### User Login Flow
```
┌─────────────────┐
│  User Visits    │
│  /login.html    │
└────────┬────────┘
         │
         ↓
┌─────────────────────────────┐
│ Page loads                  │
│ auth0-config.js loads       │
│ auth.js initializes Auth0   │
└────────┬────────────────────┘
         │
         ↓
┌─────────────────────────────┐
│ User clicks                 │
│ "Sign In with Auth0" button │
└────────┬────────────────────┘
         │
         ↓ (Redirect)
┌──────────────────────────┐
│   Auth0 Hosted Login     │
│   (Secure)               │
└────────┬─────────────────┘
         │
         ↓ (User logs in)
┌──────────────────────────┐
│   Auth0 Validates        │
│   Credentials            │
└────────┬─────────────────┘
         │
         ↓ (Redirect back)
┌──────────────────────────────────┐
│ App receives auth code           │
│ auth.js exchanges for token      │
│ handlePostLoginFlow() executes   │
└────────┬─────────────────────────┘
         │
         ↓
┌──────────────────────────────────┐
│ Calls /.netlify/functions/users  │
│ Syncs user with database         │
└────────┬─────────────────────────┘
         │
         ↓
┌──────────────────────────────────┐
│ Database returns user role       │
│ Stored in localStorage           │
└────────┬─────────────────────────┘
         │
         ↓
┌──────────────────────────────────┐
│ Check user role                  │
└────────┬──────────────────────────┘
         │
    ┌────┴────┐
    │          │
    ↓          ↓
┌────────┐  ┌──────────┐
│ admin  │  │  user    │
└───┬────┘  └────┬─────┘
    │            │
    ↓            ↓
┌──────────────────────────────────┐
│ Redirect to appropriate dashboard│
└────────┬─────────────────────────┘
         │
         ↓ (Animation)
┌──────────────────────────────────┐
│ Dashboard loaded                 │
│ User logged in & ready           │
└──────────────────────────────────┘
```

### User Signup Flow
```
┌─────────────────┐
│  User Visits    │
│ /signup.html    │
└────────┬────────┘
         │
         ↓
┌─────────────────────────────┐
│ Page loads                  │
│ auth0-config.js loads       │
│ signup.js initializes Auth0 │
└────────┬────────────────────┘
         │
         ↓
┌─────────────────────────────────┐
│ User fills in:                  │
│ - First Name                    │
│ - Last Name                     │
│ - Email                         │
│ - Phone                         │
│ - Admin Code (optional)         │
└────────┬────────────────────────┘
         │
         ↓
┌─────────────────────────────────┐
│ User clicks "Sign Up"           │
│ Profile stored in sessionStorage│
│ Redirect to Auth0 signup        │
└────────┬────────────────────────┘
         │
         ↓ (Redirect)
┌──────────────────────────┐
│   Auth0 Hosted Signup    │
│   (Secure)               │
└────────┬─────────────────┘
         │
         ↓ (User creates account)
┌──────────────────────────┐
│   Auth0 Creates Account  │
│   & Validates Email      │
└────────┬─────────────────┘
         │
         ↓ (Redirect back)
┌──────────────────────────────────┐
│ App receives auth code           │
│ signup.js handles redirect       │
│ Retrieves profile from session   │
└────────┬─────────────────────────┘
         │
         ↓
┌──────────────────────────────────┐
│ If admin code provided:          │
│ Validate with /admin function    │
└────────┬─────────────────────────┘
         │
         ↓
┌──────────────────────────────────┐
│ Set role:                        │
│ - admin (if code valid)          │
│ - user (if no code or invalid)   │
└────────┬─────────────────────────┘
         │
         ↓
┌──────────────────────────────────┐
│ Call /.netlify/functions/users   │
│ Create user in database          │
└────────┬─────────────────────────┘
         │
         ↓
┌──────────────────────────────────┐
│ User created successfully        │
│ Token stored in localStorage     │
└────────┬─────────────────────────┘
         │
         ↓
┌──────────────────────────────────┐
│ Redirect to dashboard            │
└────────┬─────────────────────────┘
         │
         ↓
┌──────────────────────────────────┐
│ Dashboard loaded                 │
│ User signed up & logged in       │
└──────────────────────────────────┘
```

---

## 📊 Architecture Diagram

```
┌────────────────────────────────────────────────────────────┐
│                     User's Browser                         │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │         Frontend (HTML/CSS/JavaScript)              │ │
│  │  ┌────────────────┐      ┌────────────────────────┐ │ │
│  │  │  login.html    │      │  signup.html           │ │ │
│  │  │                │      │                        │ │ │
│  │  │ [Sign In Btn]  │      │ [Profile Fields]       │ │ │
│  │  │                │      │ [Admin Code]           │ │ │
│  │  │                │      │ [Sign Up Btn]          │ │ │
│  │  └────────┬───────┘      └────────┬───────────────┘ │ │
│  │           │                       │                  │ │
│  │  ┌────────▼─────────────────────────▼──────────────┐ │ │
│  │  │   auth.js & signup.js                          │ │ │
│  │  │   (Auth0 initialization & flow handling)        │ │ │
│  │  └────────┬───────────────────────────────────────┘ │ │
│  │           │                                         │ │
│  │  ┌────────▼───────────────────────────────────────┐ │ │
│  │  │ auth0-config.js (Configuration)               │ │ │
│  │  │ Loads: AUTH0_DOMAIN, AUTH0_CLIENT_ID          │ │ │
│  │  │ Loads: Auth0 SDK Library                       │ │ │
│  │  └────────┬───────────────────────────────────────┘ │ │
│  │           │                                         │ │
│  │  ┌────────▼───────────────────────────────────────┐ │ │
│  │  │ localStorage                                   │ │ │
│  │  │ - auth0_token                                  │ │ │
│  │  │ - isAuthenticated                              │ │ │
│  │  │ - userRole                                     │ │ │
│  │  │ - currentUserId                                │ │ │
│  │  │ - username                                     │ │ │
│  │  │ - userEmail                                    │ │ │
│  │  └──────────────────────────────────────────────┘ │ │
│  │                                                    │ │
│  └────────────────────────────────────────────────────┘ │
│                           │                              │
└───────────────────────────┼──────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ↓                   ↓                   ↓
   ┌─────────┐        ┌──────────┐      ┌──────────────┐
   │  Auth0  │        │ Netlify  │      │    Neon      │
   │  Cloud  │        │ Functions│      │  PostgreSQL  │
   │         │        │          │      │              │
   │ Manages │        │ users.js │      │ users table: │
   │ Auth &  │        │ admin.js │      │ - auth0_id   │
   │ Tokens  │        │db-init.js│      │ - email      │
   │         │        │          │      │ - firstName  │
   └─────────┘        │Validates │      │ - lastName   │
                      │ & Creates│      │ - phone      │
                      │  Users   │      │ - role       │
                      │          │      │ - picture    │
                      └──────────┘      └──────────────┘
                            ↑                   ↑
                            └───────────────────┘
                           API Calls with JWT
```

---

## 🔄 Data Structure Overview

### Authentication State (localStorage)
```javascript
{
  "auth0_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ...",
  "isAuthenticated": "true",
  "userRole": "admin",
  "currentUserId": "auth0|6534a1b2c3d4e5f6g7h8",
  "username": "John Doe",
  "userEmail": "john@example.com"
}
```

### Database User Record (Neon)
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "auth0_id": "auth0|6534a1b2c3d4e5f6g7h8",
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "(555) 123-4567",
  "picture": "https://...",
  "role": "admin",
  "email_verified": true,
  "created_at": "2025-10-16T15:30:00Z",
  "updated_at": "2025-10-16T15:30:00Z"
}
```

### Auth0 JWT Token (Decoded)
```json
{
  "iss": "https://auctus.auth0.com/",
  "sub": "auth0|6534a1b2c3d4e5f6g7h8",
  "aud": ["auctus-api", "https://auctus.auth0.com/userinfo"],
  "iat": 1697467800,
  "exp": 1697554200,
  "email": "john@example.com",
  "email_verified": true
}
```

---

## 🎯 Configuration Checklist Visual

```
SETUP PROGRESS
═════════════════════════════════════════════════════════

[PHASE 1] Auth0 Account Setup
  ☐ Create Auth0 account
  ☐ Create SPA Application
  ☐ Get Domain ───────────────→ [AUTH0_DOMAIN]
  ☐ Get Client ID ─────────────→ [AUTH0_CLIENT_ID]
  ☐ Get Client Secret ────────→ [AUTH0_CLIENT_SECRET]
  ☐ Set Callback URLs ────────→ https://site.netlify.app
  ☐ Set Logout URLs ─────────→ https://site.netlify.app
  ☐ Set Web Origins ─────────→ https://site.netlify.app

[PHASE 2] Netlify Configuration
  ☐ Set AUTH0_DOMAIN
  ☐ Set AUTH0_CLIENT_ID
  ☐ Set AUTH0_CLIENT_SECRET
  ☐ Set AUTH0_AUDIENCE ──────→ [auctus-api]
  ☐ Set NEON_DATABASE_URL ───→ [postgresql://...]

[PHASE 3] Netlify Functions
  ☐ Verify users.js deployed
  ☐ Verify admin.js deployed
  ☐ Verify db-init.js deployed
  ☐ Run db-init.js once

[PHASE 4] Database
  ☐ Neon connected
  ☐ users table created
  ☐ Schema verified

[PHASE 5] Testing
  ☐ Login works locally
  ☐ Signup works locally
  ☐ Admin code works
  ☐ Database syncing works
  ☐ Role-based access works

[PHASE 6] Deployment
  ☐ All changes committed
  ☐ Pushed to main
  ☐ Netlify deployed
  ☐ Production verified

═════════════════════════════════════════════════════════
```

---

## 📱 User Journey Map

```
NEW USER                           EXISTING USER
═════════════════════════════════════════════════════════

  │                                     │
  ├─→ [/signup.html]                   ├─→ [/login.html]
  │   ├─ Fill profile                  │   │
  │   │  (name, email, phone)          │   ├─ Click "Sign In"
  │   │  [optional admin code]         │   │
  │   │                                │   ├─ Redirect to Auth0
  │   └─→ [Auth0 Signup Page]          │   │
  │       ├─ Create account            │   └─→ [/login.html (post-auth)]
  │       ├─ Enter password            │       ├─ Profile synced
  │       ├─ Verify email              │       ├─ Role retrieved
  │       └─→ Redirect back            │       └─→ [Dashboard]
  │           ├─ Validate admin code   │           │
  │           ├─ Create in DB          │           ├─ Admin
  │           ├─ Set role              │           │  [/admin-dashboard.html]
  │           ├─ Store token           │           │
  │           └─→ [Dashboard]          │           └─ User
  │               │                    │              [/general-dashboard.html]
  │               ├─ Admin             │
  │               │ [/admin-dash]      │
  │               │                    │
  │               └─ User              └──→ [Dashboard Usage]
  │                 [/general-dash]        ├─ View content
  │                                        ├─ Access features
  │                                        └─ [Logout]
  │                                            └─ Session ends
  │                                                ├─ Clear localStorage
  │                                                ├─ Clear Auth0 session
  │                                                └─ [/index.html]
  │
  └─→ [Authentication Complete]
```

---

## 🔐 Security Layers

```
┌─────────────────────────────────────────────────────────┐
│                   SECURITY ARCHITECTURE                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Layer 1: Frontend                                      │
│  ┌─────────────────────────────────────────────────┐   │
│  │ - No password fields                            │   │
│  │ - Auth0 SDK handles credentials                 │   │
│  │ - Tokens stored in localStorage                 │   │
│  │ - HTTPS required in production                  │   │
│  └─────────────────────────────────────────────────┘   │
│                           ↓                             │
│  Layer 2: Auth0 Service                                │
│  ┌─────────────────────────────────────────────────┐   │
│  │ - Password hashing & validation                 │   │
│  │ - JWT token generation                          │   │
│  │ - Multi-factor authentication (optional)        │   │
│  │ - 99.99% uptime & compliance                   │   │
│  └─────────────────────────────────────────────────┘   │
│                           ↓                             │
│  Layer 3: API Authentication                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │ - JWT token validation                          │   │
│  │ - Environment variables for secrets             │   │
│  │ - Backend-to-backend authentication             │   │
│  └─────────────────────────────────────────────────┘   │
│                           ↓                             │
│  Layer 4: Database                                     │
│  ┌─────────────────────────────────────────────────┐   │
│  │ - Neon PostgreSQL encryption at rest            │   │
│  │ - Connection strings in environment             │   │
│  │ - Row-level security policies                   │   │
│  │ - Backup & disaster recovery                    │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ Success Criteria

When everything is working, you'll see:

```
✓ Login button redirects to Auth0
✓ User logs in successfully
✓ Redirected back to appropriate dashboard
✓ User data appears in database
✓ Admin users see admin dashboard
✓ Regular users see general dashboard
✓ Logout button works and clears session
✓ Signup creates new Auth0 account
✓ New user data synced to database
✓ Admin code validates correctly
✓ No console errors
✓ Netlify functions executing
✓ Database queries working
```

---

## 📞 Quick Reference

| Issue | Check | Fix |
|-------|-------|-----|
| Auth0 won't load | Browser console | Check AUTH0_DOMAIN |
| Login button doesn't work | auth.js loaded | Verify auth0-config.js |
| Redirect loop | Callback URLs | Match Auth0 settings |
| User not in DB | Function logs | Check users.js |
| Admin code fails | admin.js logs | Verify code value |
| Can't logout | Auth0 settings | Add logout URL |

---

**This visual guide helps you understand the entire flow and architecture!**
