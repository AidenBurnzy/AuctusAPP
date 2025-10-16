# Admin Code Configuration Guide

## Overview

The admin code is a secret passphrase that users can enter during signup to gain admin privileges. It's validated on the backend to prevent unauthorized admin access.

## Setup

### Option 1: Environment Variable (Recommended for Production)

1. **Generate a strong admin code:**
   ```
   Example: auctus-2025-admin-secure-key-xyz
   Or: a1b2c3d4e5f6g7h8i9j0
   ```

2. **Add to Netlify environment variables:**
   - Go to Netlify Dashboard
   - Site Settings → Build & Deploy → Environment variables
   - Add new variable:
     ```
     Name: ADMIN_CODE
     Value: your-secret-admin-code
     ```

3. **Update `netlify/functions/admin.js` to validate:**
   ```javascript
   const ADMIN_CODE = process.env.ADMIN_CODE;
   
   async function validateAdminCode(code) {
     return code === ADMIN_CODE;
   }
   ```

### Option 2: Database Table (For Multiple Admins)

Create an `admin_codes` table:

```sql
CREATE TABLE admin_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(255) UNIQUE NOT NULL,
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  uses_count INT DEFAULT 0,
  max_uses INT DEFAULT NULL
);
```

Update `netlify/functions/admin.js`:
```javascript
async function validateAdminCode(code) {
  const result = await db.query(
    `SELECT * FROM admin_codes 
     WHERE code = $1 AND is_active = TRUE 
     AND (expires_at IS NULL OR expires_at > NOW())
     AND (max_uses IS NULL OR uses_count < max_uses)`,
    [code]
  );
  
  if (result.rows.length > 0) {
    // Increment uses count
    await db.query(
      `UPDATE admin_codes SET uses_count = uses_count + 1 WHERE code = $1`,
      [code]
    );
    return true;
  }
  return false;
}
```

## Usage

### How Users Get the Admin Code

1. **Share during onboarding:** Give the code to new admins in person or through secure channel
2. **Email securely:** Send through encrypted email
3. **During signup process:** Provide in signup instructions
4. **Admin dashboard:** Admins can generate codes for other admins

### Example Admin Codes

```
Production: use-a-long-random-code-like-this-one
Development: admin-dev-code-12345
Testing: test-admin-code-xyz
```

## Security Best Practices

1. **Keep it secret:** Don't commit to git, not in code
2. **Use strong codes:** At least 16 characters, mix uppercase/lowercase/numbers
3. **Rotate regularly:** Change admin code every 90 days
4. **Track usage:** Log which accounts used admin code
5. **Limited distribution:** Only share with trusted users
6. **Expire codes:** Use expiration dates for temporary access

## Example Implementation

### Signup Flow with Admin Code

```javascript
// In signup.js
async function validateAndAssignRole(adminCode) {
  if (!adminCode || adminCode.trim() === '') {
    return 'user'; // Default role
  }

  try {
    const response = await fetch('/.netlify/functions/admin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        action: 'validate-admin-code',
        adminCode: adminCode.trim()
      })
    });

    const data = await response.json();
    return data.valid ? 'admin' : 'user';
  } catch (error) {
    console.error('Error validating admin code:', error);
    return 'user'; // Default to user on error
  }
}
```

### Backend Validation

```javascript
// In netlify/functions/admin.js
exports.handler = async (event) => {
  const { action, adminCode } = JSON.parse(event.body);

  if (action === 'validate-admin-code') {
    const ADMIN_CODE = process.env.ADMIN_CODE;
    
    if (!ADMIN_CODE) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Admin code not configured' })
      };
    }

    const isValid = adminCode === ADMIN_CODE;
    
    // Log attempt (optional)
    console.log(`Admin code validation attempt: ${isValid ? 'SUCCESS' : 'FAILED'}`);

    return {
      statusCode: 200,
      body: JSON.stringify({ valid: isValid })
    };
  }

  return {
    statusCode: 400,
    body: JSON.stringify({ error: 'Unknown action' })
  };
};
```

## Troubleshooting

### Admin code not working
1. Check code is exactly correct (case-sensitive)
2. Verify code is set in environment variables
3. Check Netlify function logs for errors
4. Ensure admin.js function is deployed

### Wrong users getting admin role
1. Review admin code - may be compromised
2. Change admin code immediately
3. Check admin.js validation logic
4. Audit user roles in database

### Too many people know admin code
1. Change admin code immediately
2. Revoke admin access from non-admin users
3. Implement expiring codes
4. Use secure code sharing method

## Admin Code Management Checklist

- [ ] Generate strong admin code
- [ ] Add to Netlify environment variables
- [ ] Update admin.js function to use it
- [ ] Test signup with admin code
- [ ] Test signup without admin code
- [ ] Share code with authorized admins only
- [ ] Document where code is stored
- [ ] Set reminder to rotate code quarterly
- [ ] Log all admin code validations
- [ ] Audit admin account creation regularly

## Code Rotation Schedule

| Frequency | Purpose |
|-----------|---------|
| Initial | Set unique code at launch |
| Monthly | Audit who used the code |
| Quarterly | Rotate to new code |
| On-demand | If compromised |

## Emergency Procedures

### If Admin Code is Compromised

1. Immediately change ADMIN_CODE in Netlify
2. Redeploy admin.js function
3. Review recent user signups
4. Revoke admin access from unauthorized accounts
5. Notify admins of new code through secure channel
6. Monitor for unauthorized access

### To Add New Admin Manually

1. Login to database
2. Update user role:
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'new-admin@example.com';
   ```
3. User can login normally with new admin role

---

**Remember:** The admin code is your gatekeeper for admin access. Protect it carefully!
