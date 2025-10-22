# Client Assignment Fix for Projects

## Problem Identified
Users couldn't assign clients to projects. The issue was a **field naming mismatch** between the frontend and backend APIs.

### Root Cause
The frontend was using camelCase field names while the backend APIs and database expected snake_case:

| Issue | Frontend | Backend | Database |
|-------|----------|---------|----------|
| Client ID in project | `clientId` | `client_id` | `client_id` |
| Start date | `startDate` | `start_date` | `start_date` |
| Progress value | `progress` (string from form) | `progress` (integer) | `progress` (integer) |

### Specific Problems

**Problem 1: Project Modal Form Submission**
- Form was collecting: `{ clientId, startDate, progress (as string), description }`
- Backend expected: `{ client_id, start_date, progress (as integer), description }`
- Result: Client assignments were ignored in the database

**Problem 2: Project Display**
- Views.js was looking for: `project.clientId`
- Database returns: `project.client_id`
- Result: Client names didn't display on project cards

**Problem 3: Modal Population on Edit**
- Modal was checking: `project?.clientId === c.id`
- Database had: `project.client_id`
- Result: When editing projects, the client dropdown didn't show the previously assigned client

## Solutions Implemented

### Fix 1: Project Modal Form Submission (js/modals.js - line 293)
**Changed**: Form submission now properly converts and types fields

```javascript
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    // Convert camelCase to snake_case for backend API compatibility
    const apiData = {
        name: data.name,
        client_id: data.clientId ? parseInt(data.clientId) : null,  // ← Convert to integer
        status: data.status,
        progress: parseInt(data.progress) || 0,  // ← Convert to integer
        start_date: data.startDate || null,      // ← Use snake_case
        description: data.description
    };
    
    if (isEdit) {
        await window.storageManager.updateProject(projectId, apiData);
    } else {
        await window.storageManager.addProject(apiData);
    }
    await this.closeModal();
});
```

**Key Changes**:
- `clientId` → `client_id` (snake_case conversion)
- `startDate` → `start_date` (snake_case conversion)
- `parseInt(data.clientId)` - Ensure client ID is an integer
- `parseInt(data.progress)` - Ensure progress is an integer
- `data.clientId || null` - Handle empty client selection properly

### Fix 2: Project Modal Client Select (js/modals.js - line 200)
**Changed**: Handle both camelCase and snake_case formats when displaying

```javascript
// Client select
const clientSelect = document.createElement('select');
clientSelect.className = 'form-select';
clientSelect.name = 'clientId';
const clientOption0 = document.createElement('option');
clientOption0.value = '';
clientOption0.textContent = 'Select a client';
clientSelect.appendChild(clientOption0);
clients.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = c.name;
    // Handle both camelCase (frontend) and snake_case (database) formats
    const projectClientId = project?.clientId || project?.client_id;
    opt.selected = projectClientId == c.id; // Use == for type coercion
    clientSelect.appendChild(opt);
});
```

**Key Changes**:
- `const projectClientId = project?.clientId || project?.client_id;` - Handle both formats
- `projectClientId == c.id` - Use loose equality for type coercion
- Works whether data comes from localStorage (camelCase) or database (snake_case)

### Fix 3: Project Card Display (js/views.js - line 145)
**Changed**: Handle both field name formats when displaying client info

```javascript
renderProjectCardElement(project, clients) {
    // SECURITY: Create card using DOM APIs instead of innerHTML string
    // Handle both camelCase (frontend) and snake_case (database) formats
    const projectClientId = project.clientId || project.client_id;
    const client = projectClientId ? clients.find(c => c.id == projectClientId) : null;
    const statusClass = {
        'active': 'status-active',
        'completed': 'status-completed',
        'paused': 'status-paused'
    }[project.status] || 'status-potential';
```

**Key Changes**:
- `const projectClientId = project.clientId || project.client_id;` - Handle both formats
- Only searches for client if projectClientId exists
- Displays "No client assigned" if client not found

## Files Modified

1. **js/modals.js**
   - Line 200: Client select dropdown now handles both camelCase and snake_case
   - Line 293: Form submission now properly converts field names and types

2. **js/views.js**
   - Line 145: Project card rendering now handles both field formats

## Testing the Fix

### Test 1: Assign Client to New Project
1. Click "Add Project" button
2. Enter project name
3. Select a client from dropdown
4. Click "Create Project"
5. ✅ Project should appear with client name displayed

### Test 2: View Project with Client
1. Go to Projects view
2. Find a project with a client assigned
3. ✅ Client name should display under project name

### Test 3: Edit Project Client Assignment
1. Click on an existing project
2. Change the client assignment
3. ✅ Dropdown should show current client selected
4. Change to different client
5. Click "Update Project"
6. ✅ Project should show new client name

### Test 4: Remove Client Assignment
1. Click on a project with a client
2. Select "Select a client" (blank option)
3. Click "Update Project"
4. ✅ Project card should show "No client assigned"

## API Compatibility

The fix ensures compatibility between:

**Frontend (js/modals.js)**:
- Collects form data as camelCase
- Converts to snake_case before API call
- Sends: `{ client_id: 123, start_date: "2025-01-15", progress: 50 }`

**Backend (netlify/functions/projects.js)**:
- Expects snake_case from frontend
- Saves to database with snake_case column names
- Returns from database with snake_case field names

**Database (PostgreSQL via Neon)**:
- Tables use snake_case: `client_id`, `start_date`
- JavaScript needs conversion from snake_case when reading

## Future Improvements

**Current State**: Works but requires manual conversion in frontend
- ✅ Data is saved correctly
- ✅ Data is retrieved correctly
- ✅ UX is seamless (users don't see the field name differences)

**Future Improvement** (Optional):
- Create a data transformer utility to automatically convert between camelCase ↔ snake_case
- Would centralize all conversion logic
- Would make it easier to add new fields in the future

## Related Documentation

- `JWT_TOKEN_FIX.md` - How authentication was fixed
- `SECURITY_FIXES_COMPLETED.md` - Overall security improvements
- `DATABASE_CONNECTION_VERIFIED.md` - Database connection info
