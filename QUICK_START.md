# Quick Start Guide - Auth0 Integration

Get your Auctus app running with Auth0 and Neon Database in 5 steps.

## Step 1: Create Auth0 Application (5 minutes)

1. Go to https://manage.auth0.com/
2. Sign up or log in
3. Create new Application → Single Page Application
4. Go to Settings tab and copy:
   - **Domain** (e.g., `auctus.auth0.com`)
   - **Client ID**

## Step 2: Configure Auth0 URLs (2 minutes)

In your Auth0 Application Settings, update these fields with your Netlify site URL:

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

## Step 3: Set Netlify Environment Variables (2 minutes)

In Netlify Dashboard → Site Settings → Build & Deploy → Environment:

```
AUTH0_DOMAIN=<your-auth0-domain>
AUTH0_CLIENT_ID=<your-client-id>
AUTH0_CLIENT_SECRET=<your-client-secret>
AUTH0_AUDIENCE=auctus-api
NEON_DATABASE_URL=<your-neon-connection-string>
```

## Step 4: Create Auth0 Roles (2 minutes)

In Auth0 Dashboard → User Management → Roles:

1. Click Create Role
2. Name: `admin` → Create
3. Click Create Role again
4. Name: `user` → Create

## Step 5: Deploy & Test

```bash
# Push your changes
git add .
git commit -m "feat: Auth0 and Neon integration"
git push

# Netlify automatically deploys
# Go to your site and test login/signup
```

## Testing Locally

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Create .env.local with your values
echo "AUTH0_DOMAIN=your-domain" > .env.local
echo "AUTH0_CLIENT_ID=your-id" >> .env.local
echo "AUTH0_CLIENT_SECRET=your-secret" >> .env.local
echo "NEON_DATABASE_URL=your-db-url" >> .env.local

# Run local server with functions
netlify dev

# Open http://localhost:8888
```

## What Changed?

| File | What Changed |
|------|-------------|
| `login.html` | Uses Auth0 login button instead of form |
| `signup.html` | Uses Auth0 signup button, removed password fields |
| `js/auth.js` | Completely rewritten for Auth0 |
| `js/signup.js` | Completely rewritten for Auth0 signup flow |
| `js/auth0-config.js` | NEW - Auth0 configuration |
| `js/utils.js` | Updated logout to use Auth0 |

## How It Works

1. **User clicks Sign In** → Redirected to Auth0
2. **Auth0 authenticates** → Redirected back with token
3. **App syncs with database** → Retrieves user role
4. **Redirected to dashboard** → Based on role (admin/user)

## Need Help?

### Login not working?
- Check Auth0 domain and client ID in environment variables
- Verify callback URLs match your site URL
- Check browser console for errors

### Signup not creating user?
- Verify Netlify function `users.js` is deployed
- Check Netlify function logs for errors
- Ensure Neon database is connected

### Admin code not working?
- Verify `admin.js` Netlify function is deployed
- Check function logs in Netlify Dashboard

## Files to Reference

- **AUTH0_SETUP.md** - Detailed configuration
- **INTEGRATION_SUMMARY.md** - Technical overview
- **auth0-config.js** - Auth0 credentials
- **auth.js** - Login logic
- **signup.js** - Signup logic

## Environment Variables Checklist

```
☐ AUTH0_DOMAIN
☐ AUTH0_CLIENT_ID  
☐ AUTH0_CLIENT_SECRET
☐ AUTH0_AUDIENCE
☐ NEON_DATABASE_URL
```

## Netlify Functions Checklist

```
☐ netlify/functions/users.js deployed
☐ netlify/functions/admin.js deployed
☐ netlify/functions/db-init.js deployed
```

## Security Notes

- ⚠️ Never commit `.env.local` or environment variables to git
- ⚠️ Keep `AUTH0_CLIENT_SECRET` secret
- ⚠️ Store admin code in environment variables, not code

---

**Ready to deploy?** Push to your main branch and Netlify will automatically deploy!
