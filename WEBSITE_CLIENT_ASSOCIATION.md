# Website-Client Association Feature

## Overview
Added the ability to associate a website with each client. This lets you track which website each client is for.

## Changes Made

### 1. Database Schema Update
**File**: `netlify/functions/db-init.js`

Added `website_id` field to the `clients` table:
```sql
CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    company VARCHAR(255),
    type VARCHAR(50) NOT NULL DEFAULT 'potential',
    website_id INTEGER REFERENCES websites(id) ON DELETE SET NULL,  -- ← NEW
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
)
```

**Key Features**:
- Optional field (can be NULL)
- Foreign key references `websites.id`
- ON DELETE SET NULL: If website is deleted, client's website_id becomes NULL

### 2. Backend API Updates
**File**: `netlify/functions/clients.js`

Updated POST and PUT endpoints to handle `website_id`:

**POST** (Create Client):
```javascript
const { name, email, phone, company, type, website_id, notes } = JSON.parse(event.body);
const result = await client.query(
    'INSERT INTO clients (name, email, phone, company, type, website_id, notes) 
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
    [name, email, phone, company, type || 'potential', website_id || null, notes]
);
```

**PUT** (Update Client):
```javascript
const { id, name, email, phone, company, type, website_id, notes } = JSON.parse(event.body);
const result = await client.query(
    'UPDATE clients SET name=$1, email=$2, phone=$3, company=$4, type=$5, 
     website_id=$6, notes=$7, updated_at=NOW() WHERE id=$8 RETURNING *',
    [name, email, phone, company, type, website_id || null, notes, id]
);
```

### 3. Frontend Modal Updates
**File**: `js/modals.js`

Added website dropdown to the client modal (`openClientModal` function):

```javascript
// Website select
const websites = await window.storageManager.getWebsites();
const websiteSelect = document.createElement('select');
websiteSelect.className = 'form-select';
websiteSelect.name = 'website_id';
const websiteOption0 = document.createElement('option');
websiteOption0.value = '';
websiteOption0.textContent = 'No website';
websiteSelect.appendChild(websiteOption0);
websites.forEach(w => {
    const opt = document.createElement('option');
    opt.value = w.id;
    opt.textContent = w.name;
    const clientWebsiteId = client?.website_id || client?.websiteId;
    opt.selected = clientWebsiteId == w.id;
    websiteSelect.appendChild(opt);
});
form.appendChild(createFormGroup('Website', websiteSelect));
```

**Form Submission**:
- Converts `website_id` to integer when provided
- Sets to `null` if not selected
- Properly handles both create and edit operations

### 4. Frontend Display Updates
**File**: `js/views.js`

Updated `renderClientsView` and `renderClientCardElement`:

**In `renderClientsView`**:
- Now fetches websites list
- Passes websites to card rendering function

**In `renderClientCardElement`**:
- Displays website name with globe icon if assigned
- Handles both `website_id` (database) and `websiteId` (frontend) formats
- Shows formatted output: `🌐 Website Name`

**Example Card**:
```
┌────────────────────────────┐
│ Client Name        [Current]│
│ client@email.com           │
│ 🌐 My Website              │
│ 📞 (555) 123-4567          │
└────────────────────────────┘
```

## How to Use

### Add/Edit Client with Website

1. Click "Add Client" or click existing client to edit
2. Fill in client details (name, email, phone, company, etc.)
3. **Select Website** from the dropdown (optional)
4. Select Client Type (Current/Potential)
5. Add Notes if desired
6. Click "Add Client" or "Update Client"

### View Websites Associated with Clients

- Go to Clients view
- See website icon (🌐) with website name on each client card
- If no website assigned, website field is not displayed

### Remove Website Association

1. Edit the client
2. Select "No website" from the Website dropdown
3. Click "Update Client"

## Data Flow

```
Client Modal
    ↓
Website Dropdown (loaded from storage)
    ↓
Form Submission
    ↓
Convert website_id to integer or null
    ↓
Send to API: POST/PUT /.netlify/functions/clients
    ↓
Backend validates and saves
    ↓
Database stores website_id in clients table
    ↓
Display on Client Card with website name
```

## Database Migration Notes

**Important for Existing Databases**:

If you have an existing database without the `website_id` column:

1. Set `DB_INIT_ENABLED=true` on Netlify temporarily
2. Call the db-init endpoint to update schema
3. The new column will be added to the clients table
4. Existing clients will have `website_id = NULL`
5. Set `DB_INIT_ENABLED=false` to lock it down

Or manually run:
```sql
ALTER TABLE clients ADD COLUMN website_id INTEGER REFERENCES websites(id) ON DELETE SET NULL;
```

## Field Names

- **Frontend form field**: `website_id` (matches backend)
- **Database column**: `website_id`
- **API parameter**: `website_id`
- **Frontend object property**: Can be either `website_id` (from database) or `websiteId` (camelCase) - code handles both

## Validation

- ✅ Website ID is validated as integer
- ✅ Only valid website IDs can be assigned
- ✅ Deleting a website automatically removes assignment from clients
- ✅ Website field is optional (can be null)

## Related Features

- Clients can be associated with Projects (separate feature)
- Websites can be tracked independently
- Each client can have one website assigned

## Future Enhancements

- [ ] Allow multiple websites per client
- [ ] Display client's website URL in client card
- [ ] Quick link to edit website from client card
- [ ] Filter clients by website
