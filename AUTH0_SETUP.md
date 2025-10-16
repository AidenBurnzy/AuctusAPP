# Auth0 and Neon Database Integration Guide

This document outlines the setup required to complete the Auth0 and Neon Database integration for the Auctus application.

## Overview

Your application has been updated to:
- Use **Auth0** for user authentication and account creation
- Use **Neon PostgreSQL Database** for persistent user data storage
- Remove localStorage-based user management
- Support role-based access control (admin/user)

## Required Configuration

### 1. Auth0 Setup

#### Create an Auth0 Application:
1. Go to [Auth0 Dashboard](https://manage.auth0.com/)
2. Navigate to **Applications → Applications** → **Create Application**
3. Choose **Single Page Application** (or Regular Web Application if hosting backend)
4. Give it a name like "Auctus App"
5. Note the following values from the Settings tab:
   - **Domain**: `YOUR_AUTH0_DOMAIN` (e.g., `auctus.auth0.com`)
   - **Client ID**: `YOUR_AUTH0_CLIENT_ID`
   - **Client Secret**: `YOUR_AUTH0_CLIENT_SECRET` (keep this secret!)

#### Configure Auth0 Application URLs:
In the Auth0 Application Settings, set:
- **Allowed Callback URLs**: `https://your-netlify-domain.netlify.app`, `http://localhost:8888`
- **Allowed Logout URLs**: `https://your-netlify-domain.netlify.app`, `http://localhost:8888`
- **Allowed Web Origins**: `https://your-netlify-domain.netlify.app`, `http://localhost:8888`

#### Create API (Optional but Recommended):
1. Go to **Applications → APIs** → **Create API**
2. Name: "Auctus API"
3. Identifier (Audience): `auctus-api` (or similar)
4. Keep this value for later

#### Create Roles:
1. Go to **User Management → Roles** → **Create Role**
2. Create two roles:
   - Name: `admin` | Description: "Administrator with full access"
   - Name: `user` | Description: "Regular user access"

### 2. Netlify Environment Variables

Add the following environment variables in Netlify (Settings → Build & Deploy → Environment):

```
AUTH0_DOMAIN=YOUR_AUTH0_DOMAIN
AUTH0_CLIENT_ID=YOUR_AUTH0_CLIENT_ID
AUTH0_CLIENT_SECRET=YOUR_AUTH0_CLIENT_SECRET
AUTH0_AUDIENCE=auctus-api (or your chosen API identifier)
NEON_DATABASE_URL=postgresql://user:password@your-neon-host/database
```

### 3. Netlify Functions

The following Netlify serverless functions should be created in the `netlify/functions/` directory:

#### `users.js` - User Management
```javascript
// Handles user creation and retrieval from Neon database
// Called from auth.js after Auth0 login
```

#### `admin.js` - Admin Functions
```javascript
// Handles admin code validation and user role management
// Called from signup.js to validate admin codes
```

#### `db-init.js` - Database Initialization
```javascript
// Creates the users table if it doesn't exist
// Run this once to initialize the database schema
```

**Note**: These functions should have been created by the Netlify AI. Verify they exist in your `netlify/functions/` directory and are properly configured to access the Neon database.

### 4. Frontend Configuration File

The file `js/auth0-config.js` has been created and contains:
```javascript
window.AUTH0_DOMAIN = process.env.AUTH0_DOMAIN
window.AUTH0_CLIENT_ID = process.env.AUTH0_CLIENT_ID
window.AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE
```

This file loads the Auth0 JavaScript SDK automatically.

## Updated Files

### HTML Pages:
- **`login.html`**: Updated to use Auth0 login button (no password field)
- **`signup.html`**: Updated to use Auth0 signup button (no password fields, preserves admin code field)

### JavaScript Files:
- **`js/auth.js`**: Completely rewritten to use Auth0 SDK
  - Handles Auth0 login/logout
  - Syncs user profile with Neon database
  - Manages authentication state
  
- **`js/signup.js`**: Completely rewritten to use Auth0 signup
  - Handles profile information collection
  - Validates admin codes with backend
  - Creates user in Neon database
  
- **`js/auth0-config.js`**: New file
  - Loads Auth0 SDK
  - Sets up Auth0 configuration variables
  
- **`js/utils.js`**: Updated logout function
  - Now calls Auth0 logout instead of clearing localStorage

## How It Works

### Login Flow:
1. User clicks "Sign In with Auth0" button
2. Redirected to Auth0's hosted login page
3. Auth0 authenticates the user
4. User is redirected back to your site
5. `auth.js` syncs user profile with Neon database
6. User role is retrieved from database
7. User is redirected to appropriate dashboard (admin/general)

### Signup Flow:
1. User fills in profile info (firstName, lastName, email, phone, optional admin code)
2. User clicks "Sign Up with Auth0" button
3. Redirected to Auth0's hosted signup page
4. Auth0 creates the account
5. User is redirected back to your site
6. `signup.js` validates the admin code (if provided)
7. User profile is created in Neon database with appropriate role
8. User is redirected to appropriate dashboard

### Admin Code Validation:
- The admin code is validated in the `admin.js` Netlify function
- Only correct admin codes result in the user being assigned the "admin" role
- The admin code should be stored securely in your backend configuration

## Local Development Setup

For local testing with Netlify Functions:

1. Install Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

2. Set up local environment file (`.env.local`):
   ```
   AUTH0_DOMAIN=YOUR_AUTH0_DOMAIN
   AUTH0_CLIENT_ID=YOUR_AUTH0_CLIENT_ID
   AUTH0_CLIENT_SECRET=YOUR_AUTH0_CLIENT_SECRET
   AUTH0_AUDIENCE=auctus-api
   NEON_DATABASE_URL=postgresql://user:password@your-neon-host/database
   ```

3. Run local development:
   ```bash
   netlify dev
   ```

This will run your site locally with functions support at `http://localhost:8888`

## Testing Checklist

- [ ] Auth0 application created with correct URLs
- [ ] Environment variables set in Netlify
- [ ] Netlify functions deployed (`users.js`, `admin.js`)
- [ ] Login button works and redirects to Auth0
- [ ] Login with Auth0 account redirects to appropriate dashboard
- [ ] Signup button works and redirects to Auth0
- [ ] Signup with admin code assigns admin role
- [ ] Signup without admin code assigns user role
- [ ] User data is synced to Neon database
- [ ] Logout redirects to home page and clears Auth0 session
- [ ] Admin dashboard only accessible with admin role
- [ ] General dashboard only accessible with user role

## Security Notes

1. **Never expose secrets**: `AUTH0_CLIENT_SECRET` should only be in Netlify environment variables, never in code or committed to git
2. **Validate tokens**: All API calls from frontend to serverless functions should validate Auth0 tokens
3. **Admin code**: Store the valid admin code in environment variables or backend configuration, not in frontend code
4. **HTTPS**: Always use HTTPS in production (Netlify handles this)

## Troubleshooting

### "Failed to initialize Auth0"
- Check that `AUTH0_DOMAIN` and `AUTH0_CLIENT_ID` are correct in Netlify environment variables
- Verify the Auth0 application exists and is configured

### "Invalid Redirect URI"
- Ensure your site URL is added to "Allowed Callback URLs" in Auth0 Application Settings
- For local dev, add `http://localhost:8888` to the URLs

### User role always "user"
- Check that the Neon database is properly connected
- Verify the `users.js` function is correctly retrieving roles from the database
- Check browser console for errors

### Admin code not working
- Verify the admin code is being validated in the `admin.js` function
- Check that the correct admin code is being used
- Look for errors in Netlify function logs

## Next Steps

1. Configure Auth0 application with your domain and credentials
2. Set environment variables in Netlify
3. Verify Netlify functions are deployed and working
4. Test the login/signup flows
5. Verify user data is being stored in Neon database
6. Deploy to production when everything is working locally

For more information:
- [Auth0 Documentation](https://auth0.com/docs)
- [Netlify Functions Documentation](https://docs.netlify.com/functions/overview/)
- [Neon Documentation](https://neon.tech/docs)
