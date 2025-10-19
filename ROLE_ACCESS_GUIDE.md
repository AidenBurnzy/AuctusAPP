# Role-Based Access Control Guide

## Overview
Auctus Ventures app now features role-based access control with two user levels:
- **Admin/Owner** - Full access to business management (password protected)
- **Employee** - Limited access portal (coming soon)

## Features

### Landing Page
When you open the app, you'll see a role selection screen with two options:
1. **Admin / Owner** - Access the full business management system
2. **Employee** - Access the employee portal

### Admin Access
- **Password**: `0000` (simple password for now)
- **Full Features**:
  - Dashboard with business statistics
  - Client Management
  - Project Management
  - Website Tracking
  - Ideas & Notes
  - Financial Management (recurring income, subscriptions, budget allocations, payroll)
  - Settings & Tools
  
- **Admin Badge**: Shows "🛡️ Admin" in the header
- **Logout Button**: Return to role selection screen

### Employee Portal
- **No Password Required**: Direct access for employees
- **Current Status**: Placeholder with coming soon message
- **Planned Features**:
  - ✅ Schedule & Time Tracking
  - ✅ Assigned Tasks & Projects
  - ✅ Payroll Information
  - ✅ Company Documents
  - ✅ Team Communication

- **Employee Badge**: Shows "👤 Employee" in the header
- **Logout Button**: Return to role selection screen

## How It Works

### First Time Users
1. App loads with role selection screen
2. Choose your access level:
   - Click "Access Admin Panel" for owner/admin access
   - Click "Employee Portal" for employee access

### Admin Login
1. Click "Access Admin Panel"
2. Enter password: `0000`
3. Click "Login" or press Enter
4. Access granted to full admin dashboard

### Returning Users
- Your role choice is saved in browser
- App automatically shows your last selected role
- No need to login again unless you logout

### Logout
- Click the 🚪 logout icon in the header
- Returns to role selection screen
- Clears saved authentication

## Security Notes

### Current Implementation
- **Password**: Simple 4-digit PIN (`0000`)
- **Storage**: Role saved in browser localStorage
- **Purpose**: Basic access separation, not high security

### Future Enhancements
To improve security in production:
1. **Change Password**: Update `adminPassword` in `js/app.js`
2. **Multiple Users**: Add user accounts with individual passwords
3. **Backend Auth**: Move authentication to server-side (Netlify Functions)
4. **Session Timeout**: Auto-logout after inactivity
5. **Password Encryption**: Hash passwords instead of plain text
6. **2FA**: Add two-factor authentication
7. **Role Permissions**: Granular permissions per user

## Changing the Password

### Quick Change (Current System)
1. Open `js/app.js`
2. Find line: `this.adminPassword = '0000';`
3. Change to your desired password: `this.adminPassword = 'YourPassword';`
4. Save and commit

### Recommended for Production
- Move password to environment variable
- Use Netlify Functions for authentication
- Store hashed passwords in Neon database
- Implement proper session management

## Technical Details

### File Structure
```
index.html
├── Role Selection Screen (#role-selection)
├── Admin Login Modal (#admin-login-modal)
├── Admin Panel (#app)
└── Employee Portal (#employee-portal)
```

### Authentication Flow
```javascript
1. App loads → Check localStorage for saved auth
2. If authenticated → Show saved role (admin/employee)
3. If not authenticated → Show role selection
4. Admin selected → Show password modal
5. Password correct → Save auth + Show admin panel
6. Employee selected → Save auth + Show employee portal
7. Logout → Clear auth + Show role selection
```

### LocalStorage Keys
- `auctus_auth`: Stores authentication state
  ```json
  {
    "isAuthenticated": true,
    "role": "admin" // or "employee"
  }
  ```

### CSS Classes
- `.role-selection-container`: Main landing page
- `.role-card`: Individual role option cards
- `.admin-badge`: Admin indicator in header
- `.employee-badge`: Employee indicator in header
- `.empty-state`: Employee portal placeholder

## User Experience

### Visual Design
- **Landing Page**: Clean two-card layout with icons
- **Hover Effects**: Cards lift and glow on hover
- **Color Coding**: 
  - Admin: Purple theme (primary color)
  - Employee: Green theme (secondary color)
- **Responsive**: Works on mobile and desktop

### Navigation
- **Logo Click**: Returns to dashboard (admin) or stays on portal (employee)
- **Back Button**: Logout returns to role selection
- **Persistent**: Role choice saved across sessions

## Development Roadmap

### Phase 1: Basic Separation ✅ (Current)
- [x] Role selection screen
- [x] Admin password protection
- [x] Employee portal placeholder
- [x] Authentication persistence
- [x] Logout functionality

### Phase 2: Employee Features (Planned)
- [ ] Employee dashboard
- [ ] Personal payroll view
- [ ] Task assignments
- [ ] Time tracking
- [ ] Document library
- [ ] Team chat

### Phase 3: Enhanced Security (Future)
- [ ] Backend authentication
- [ ] Database user accounts
- [ ] Password hashing
- [ ] Session management
- [ ] Role permissions
- [ ] Audit logging

### Phase 4: Multi-User Admin (Future)
- [ ] Multiple admin accounts
- [ ] Permission levels (Super Admin, Manager, Accountant)
- [ ] User management interface
- [ ] Activity tracking per user

## Troubleshooting

### Can't Login as Admin
- **Check Password**: Must be exactly `0000` (four zeros)
- **Clear Cache**: Hard refresh the page (Ctrl+Shift+R)
- **Check Console**: Open browser DevTools for errors

### Stuck on Role Selection
- **Clear LocalStorage**: Run in browser console:
  ```javascript
  localStorage.removeItem('auctus_auth');
  location.reload();
  ```

### Want to Switch Roles
- Click the logout button (🚪) in the header
- Choose different role from selection screen

## Best Practices

### For Admins
1. **Logout on Shared Devices**: Always logout when using shared computers
2. **Password Security**: Change default password before sharing with others
3. **Regular Backups**: Use Settings → Database Tools → Export Data (coming soon)

### For Development
1. **Test Both Roles**: Verify features work for each role
2. **Check Mobile**: Test on actual mobile devices
3. **Update Documentation**: Keep this guide current with changes

## Support

### Questions?
- Review this guide
- Check `SETTINGS_MENU_GUIDE.md` for admin features
- See `FINANCIAL_SYSTEM_GUIDE.md` for finances help

### Need Changes?
- Password change: Edit `js/app.js`
- UI customization: Edit `css/styles.css`
- Add features: Edit relevant view files

---

**Version**: 1.0  
**Last Updated**: October 19, 2025  
**Status**: Production Ready (Basic Protection)
