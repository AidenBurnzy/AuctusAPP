// Auctus Admin Dashboard JavaScript
// Handles all admin dashboard functionality

// Check authentication
const currentUser = checkAuth('admin');
if (!currentUser) {
    // checkAuth will redirect if not authenticated
} else {
    initializeDashboard();
}

function initializeDashboard() {
    // Navigation
    setupNavigation();
    
    // Logout
    setupLogout();
    
    // Load initial data
    updateDashboardStats();
    loadRecentActivity();
    
    // QuickBooks
    setupQuickBooks();
    
    // To-Do List
    setupTodoList();
    
    // Client Management
    setupClientList();
    setupAddClient();
}

// Navigation between sections
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.section-content');
    const sectionTitle = document.getElementById('sectionTitle');
    
    const titles = {
        'overview': 'Dashboard Overview',
        'quickbooks': 'QuickBooks Integration',
        'todos': 'To-Do List',
        'clients': 'Client Management',
        'add-client': 'Add New Client'
    };
    
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const sectionId = item.dataset.section;
            
            // Update active nav item
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            // Show corresponding section
            sections.forEach(section => section.classList.remove('active'));
            document.getElementById(`${sectionId}-section`).classList.add('active');
            
            // Update title
            sectionTitle.textContent = titles[sectionId];
        });
    });
}

// Logout functionality
function setupLogout() {
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('auctusUser');
        showToast('Logged out successfully', 'success');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    });
}

// Recent Activity
function loadRecentActivity() {
    const activityList = document.getElementById('activityList');
    const activities = getStorageData('auctusActivity', []);
    
    if (activities.length === 0) {
        activityList.innerHTML = '<p class="empty-state">No recent activity</p>';
        return;
    }
    
    activityList.innerHTML = activities
        .slice(0, 5)
        .map(activity => `
            <div class="activity-item">
                <strong>${activity.title}</strong>
                <p style="margin: 4px 0 0 0; color: var(--medium-gray); font-size: 0.9rem;">
                    ${activity.description} - ${formatDate(activity.date)}
                </p>
            </div>
        `).join('');
}

// Add activity log
function logActivity(title, description) {
    const activities = getStorageData('auctusActivity', []);
    activities.unshift({
        id: generateId(),
        title,
        description,
        date: new Date().toISOString()
    });
    
    // Keep only last 50 activities
    if (activities.length > 50) {
        activities.length = 50;
    }
    
    saveStorageData('auctusActivity', activities);
    loadRecentActivity();
}

// QuickBooks Integration
function setupQuickBooks() {
    const syncBtn = document.getElementById('syncQuickbooks');
    
    syncBtn.addEventListener('click', () => {
        syncBtn.textContent = 'Syncing...';
        syncBtn.disabled = true;
        
        // Simulate API call
        setTimeout(() => {
            loadQuickBooksData();
            syncBtn.textContent = 'Sync Now';
            syncBtn.disabled = false;
            showToast('QuickBooks data synced successfully', 'success');
            logActivity('QuickBooks Sync', 'Financial data synchronized');
        }, 1500);
    });
    
    loadQuickBooksData();
}

function loadQuickBooksData() {
    // In production, this would fetch from QuickBooks API
    const clients = getStorageData('auctusClients', []);
    const activeClients = clients.filter(c => c.status === 'active');
    
    const thisMonth = activeClients.reduce((sum, c) => sum + parseFloat(c.monthlyFee || 0), 0);
    const lastMonth = thisMonth * 0.92; // Demo data
    const ytd = thisMonth * 10; // Demo data
    
    document.getElementById('qbThisMonth').textContent = formatCurrency(thisMonth);
    document.getElementById('qbLastMonth').textContent = formatCurrency(lastMonth);
    document.getElementById('qbYTD').textContent = formatCurrency(ytd);
    
    // Load recent invoices
    loadInvoices(activeClients);
}

function loadInvoices(clients) {
    const invoiceList = document.getElementById('invoiceList');
    
    if (clients.length === 0) {
        invoiceList.innerHTML = '<p class="empty-state">No invoices found</p>';
        return;
    }
    
    invoiceList.innerHTML = clients
        .slice(0, 5)
        .map(client => `
            <div class="invoice-item">
                <div>
                    <strong>${client.companyName}</strong>
                    <p style="margin: 4px 0 0 0; color: var(--medium-gray); font-size: 0.875rem;">
                        Invoice #${Math.floor(Math.random() * 10000)}
                    </p>
                </div>
                <div style="text-align: right;">
                    <strong style="color: var(--primary-orange);">${formatCurrency(client.monthlyFee)}</strong>
                    <p style="margin: 4px 0 0 0; color: var(--success); font-size: 0.875rem;">Paid</p>
                </div>
            </div>
        `).join('');
}

// To-Do List Management
function setupTodoList() {
    const addTodoBtn = document.getElementById('addTodoBtn');
    const addTodoForm = document.getElementById('addTodoForm');
    const saveTodoBtn = document.getElementById('saveTodoBtn');
    const cancelTodoBtn = document.getElementById('cancelTodoBtn');
    
    addTodoBtn.addEventListener('click', () => {
        addTodoForm.style.display = 'block';
        addTodoBtn.style.display = 'none';
    });
    
    cancelTodoBtn.addEventListener('click', () => {
        addTodoForm.style.display = 'none';
        addTodoBtn.style.display = 'block';
        clearTodoForm();
    });
    
    saveTodoBtn.addEventListener('click', () => {
        saveTodo();
    });
    
    loadTodos();
}

function saveTodo() {
    const title = document.getElementById('todoTitle').value.trim();
    const description = document.getElementById('todoDescription').value.trim();
    const priority = document.getElementById('todoPriority').value;
    
    if (!title) {
        showToast('Please enter a task title', 'error');
        return;
    }
    
    const todos = getStorageData('auctusTodos', []);
    const newTodo = {
        id: generateId(),
        title,
        description,
        priority,
        completed: false,
        createdAt: new Date().toISOString()
    };
    
    todos.unshift(newTodo);
    saveStorageData('auctusTodos', todos);
    
    clearTodoForm();
    document.getElementById('addTodoForm').style.display = 'none';
    document.getElementById('addTodoBtn').style.display = 'block';
    
    loadTodos();
    updateDashboardStats();
    showToast('Task added successfully', 'success');
    logActivity('Task Created', `New task: ${title}`);
}

function clearTodoForm() {
    document.getElementById('todoTitle').value = '';
    document.getElementById('todoDescription').value = '';
    document.getElementById('todoPriority').value = 'low';
}

function loadTodos() {
    const todoList = document.getElementById('todoList');
    const todos = getStorageData('auctusTodos', []);
    
    if (todos.length === 0) {
        todoList.innerHTML = '<p class="empty-state">No tasks yet. Click "Add Task" to get started!</p>';
        return;
    }
    
    todoList.innerHTML = todos.map(todo => `
        <div class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
            <div class="todo-content">
                <h4>${todo.title}</h4>
                ${todo.description ? `<p>${todo.description}</p>` : ''}
                <span class="todo-priority ${todo.priority}">${todo.priority}</span>
            </div>
            <div class="todo-actions">
                <button class="btn-secondary" onclick="toggleTodoComplete('${todo.id}')">
                    ${todo.completed ? 'Undo' : 'Complete'}
                </button>
                <button class="btn-secondary" onclick="deleteTodo('${todo.id}')" style="background: var(--danger); color: white; border: none;">
                    Delete
                </button>
            </div>
        </div>
    `).join('');
}

function toggleTodoComplete(todoId) {
    const todos = getStorageData('auctusTodos', []);
    const todo = todos.find(t => t.id === todoId);
    
    if (todo) {
        todo.completed = !todo.completed;
        saveStorageData('auctusTodos', todos);
        loadTodos();
        updateDashboardStats();
        showToast(todo.completed ? 'Task completed!' : 'Task reopened', 'success');
    }
}

function deleteTodo(todoId) {
    if (confirm('Are you sure you want to delete this task?')) {
        let todos = getStorageData('auctusTodos', []);
        todos = todos.filter(t => t.id !== todoId);
        saveStorageData('auctusTodos', todos);
        loadTodos();
        updateDashboardStats();
        showToast('Task deleted', 'success');
    }
}

// Client List Management
function setupClientList() {
    const clientSearch = document.querySelector('#clients-section .search-input');
    
    if (clientSearch) {
        clientSearch.addEventListener('input', () => {
            filterTable(clientSearch, document.getElementById('clientsTableBody'));
        });
    }
    
    loadClients();
}

function loadClients() {
    const tableBody = document.getElementById('clientsTableBody');
    const clients = getStorageData('auctusClients', []);
    
    if (clients.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="empty-state">No clients found</td></tr>';
        return;
    }
    
    tableBody.innerHTML = clients.map(client => `
        <tr>
            <td><strong>${client.companyName}</strong></td>
            <td>${client.contactName}</td>
            <td>${client.email}</td>
            <td>${formatCurrency(client.monthlyFee)}</td>
            <td><span class="status-badge ${client.status}">${client.status}</span></td>
            <td>
                <button class="btn-secondary" onclick="viewClient('${client.id}')" style="padding: 6px 12px; font-size: 0.875rem;">
                    View
                </button>
                <button class="btn-secondary" onclick="deleteClient('${client.id}')" style="padding: 6px 12px; font-size: 0.875rem; background: var(--danger); color: white; border: none; margin-left: 8px;">
                    Delete
                </button>
            </td>
        </tr>
    `).join('');
}

function viewClient(clientId) {
    const clients = getStorageData('auctusClients', []);
    const client = clients.find(c => c.id === clientId);
    
    if (client) {
        alert(`Client Details:\n\nCompany: ${client.companyName}\nContact: ${client.contactName}\nEmail: ${client.email}\nPhone: ${client.phone || 'N/A'}\nMonthly Fee: ${formatCurrency(client.monthlyFee)}\nWebsite: ${client.website || 'N/A'}\nStart Date: ${formatDate(client.startDate)}\nNotes: ${client.notes || 'N/A'}`);
    }
}

function deleteClient(clientId) {
    if (confirm('Are you sure you want to delete this client?')) {
        let clients = getStorageData('auctusClients', []);
        const client = clients.find(c => c.id === clientId);
        clients = clients.filter(c => c.id !== clientId);
        saveStorageData('auctusClients', clients);
        loadClients();
        updateDashboardStats();
        showToast('Client deleted successfully', 'success');
        if (client) {
            logActivity('Client Deleted', `${client.companyName} removed from system`);
        }
    }
}

// Add New Client
function setupAddClient() {
    const form = document.getElementById('addClientForm');
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const newClient = {
            id: generateId(),
            companyName: document.getElementById('companyName').value.trim(),
            contactName: document.getElementById('contactName').value.trim(),
            email: document.getElementById('email').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            monthlyFee: parseFloat(document.getElementById('monthlyFee').value),
            startDate: document.getElementById('startDate').value,
            website: document.getElementById('website').value.trim(),
            notes: document.getElementById('notes').value.trim(),
            status: 'active',
            createdAt: new Date().toISOString()
        };
        
        const clients = getStorageData('auctusClients', []);
        clients.unshift(newClient);
        saveStorageData('auctusClients', clients);
        
        form.reset();
        loadClients();
        updateDashboardStats();
        showToast('Client added successfully!', 'success');
        logActivity('New Client Added', `${newClient.companyName} joined Auctus`);
        
        // Switch to clients view
        document.querySelector('[data-section="clients"]').click();
    });
}

// Make functions global so they can be called from HTML onclick
window.toggleTodoComplete = toggleTodoComplete;
window.deleteTodo = deleteTodo;
window.viewClient = viewClient;
window.deleteClient = deleteClient;