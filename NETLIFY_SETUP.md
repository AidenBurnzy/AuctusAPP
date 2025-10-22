# Netlify Environment Setup Guide

## Quick Setup Instructions

### 1. Access Netlify Dashboard
1. Go to [app.netlify.com](https://app.netlify.com)
2. Select your site: `auctusventures` (or your site name)
3. Navigate to: **Site Settings** (top menu) → **Build & Deploy** → **Environment**

### 2. Add Environment Variables

Click **"Edit variables"** and add these variables:

```
ALLOWED_ORIGINS=https://auctusventures.netlify.app

ADMIN_PASSWORD=<create-a-strong-password>

JWT_SECRET=<create-a-long-random-string>

DEBUG=false
```

### How to Generate Secure Values

#### For ADMIN_PASSWORD:
```bash
# Generate a strong password (run in terminal)
openssl rand -base64 12
# Example output: "a3kF9jX2mP8vL5nQ"
```

#### For JWT_SECRET:
```bash
# Generate a long random string (run in terminal)
openssl rand -base64 32
# Example output: "x7kP2mN9qW5vL3tR8uY1sJ4gF6hB9cD2e3Z0aS1x7kP2mN9"
```

### 3. Verify Setup

After adding variables:
1. Deploy a new version: `git push` (triggers new deploy)
2. Check Netlify Functions in Deploy logs
3. Should see no CORS errors in browser console

---

## What Each Variable Does

| Variable | Purpose | Example |
|----------|---------|---------|
| `ALLOWED_ORIGINS` | Restricts API access to your domain | `https://auctusventures.netlify.app` |
| `ADMIN_PASSWORD` | Password for admin login | `a3kF9jX2mP8vL5nQ` |
| `JWT_SECRET` | Secret for signing auth tokens | `x7kP2mN9qW5vL3tR8uY1sJ4gF6hB9...` |
| `DEBUG` | Show detailed error messages (dev only) | `false` (or `true` for development) |

---

## Verification Checklist

After setup, verify everything works:

### ✅ CORS is Restricted
```bash
# Test from different domain (should fail)
curl -X GET https://auctusventures.netlify.app/.netlify/functions/clients \
  -H "Origin: https://example.com"
# Should return CORS error
```

### ✅ Error Messages are Safe
1. Open app in browser
2. Try to access with broken request
3. Should see: "An error occurred processing your request"
4. Should NOT see: Database errors or system info

### ✅ Deployment Successful
1. After pushing changes, wait for deploy to complete
2. Go to **Deployments** tab on Netlify
3. Should show green checkmark ✅

---

## Troubleshooting

### Problem: "CORS error in console"
**Solution:** Check if `ALLOWED_ORIGINS` matches your domain exactly
- Include `https://` (not `http://`)
- No trailing slashes
- Check for typos

### Problem: "Errors still show system details"
**Solution:** Ensure `DEBUG=false` in environment variables
- Set to `true` only for development
- Redeploy after changing

### Problem: "Auth not working"
**Solution:** Multiple things to check:
1. `ADMIN_PASSWORD` is set ✓
2. Using correct password
3. Backend auth endpoint created (if implemented)
4. Check browser console for errors

### Problem: "Environment variables not loading"
**Solution:** 
1. Redeploy site (push new commit to trigger)
2. Wait 2-3 minutes for functions to rebuild
3. Clear browser cache and reload
4. Check Deploy log for errors

---

## Netlify Build Logs

To see if environment variables loaded correctly:

1. Go to **Deployments** tab
2. Click latest deploy
3. Scroll down to **Deploy log**
4. Search for: `environment` or `ALLOWED_ORIGINS`
5. Should see: `✓ Build complete`

---

## Production vs Development

### Development (only for testing)
```
DEBUG=true
ADMIN_PASSWORD=0000
JWT_SECRET=dev-secret-not-secure
ALLOWED_ORIGINS=localhost:5000,127.0.0.1:3000
```

### Production (secure)
```
DEBUG=false
ADMIN_PASSWORD=<strong-random-password>
JWT_SECRET=<long-random-string>
ALLOWED_ORIGINS=https://yourdomain.com
```

---

## Security Best Practices

✅ **DO:**
- Use strong, random passwords
- Keep secrets in environment variables (never in code)
- Set `DEBUG=false` in production
- Restrict `ALLOWED_ORIGINS` to your domain only
- Rotate secrets periodically

❌ **DON'T:**
- Hardcode passwords in code
- Share secrets in Git commits
- Use `ALLOWED_ORIGINS=*`
- Enable `DEBUG=true` in production
- Commit `.env` files to Git

---

## If Something Goes Wrong

### Rollback Instructions

If after adding environment variables, the site breaks:

1. Go to **Deployments** tab on Netlify
2. Find the previous working deployment
3. Click the **...** menu
4. Select **Publish deploy**
5. Site reverts to previous version

Your code changes are safe, only the environment config rolled back.

---

## Next: Backend Authentication

Once environment variables are set, implement:

```javascript
// Create: netlify/functions/auth.js
exports.handler = async (event) => {
  const { password } = JSON.parse(event.body);
  
  if (password !== process.env.ADMIN_PASSWORD) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Unauthorized' })
    };
  }
  
  // Generate JWT token and return it
  // (requires JWT library: npm install jsonwebtoken)
};
```

See `SECURITY_IMPROVEMENTS.md` for full implementation guide.

---

## Support

- **Netlify Docs:** https://docs.netlify.com/environment-variables/overview/
- **Security Guide:** See `SECURITY_IMPROVEMENTS.md`
- **Questions?** Check the code comments in Netlify functions

---

**Last Updated:** October 22, 2025
