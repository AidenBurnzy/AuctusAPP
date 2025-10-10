// Auctus General User Dashboard JavaScript
// Handles functionality for general users (limited access)

// Check authentication
const currentUser = checkAuth('general');
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
    
    // To-Do List (read-only for general users)
    loadTodos();
    
    // Client List (limited view)
    setupClientList();
}

// Navigation between sections
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.section-content');
    const sectionTitle = document.getElementById('sectionTitle');
    
    const titles = {
        'overview': 'Dashboard Overview',
        'todos': 'My Tasks',
        'clients': 'Client List'
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

// To-Do List (Read-only for general users)
function loadTodos() {
    const todoList = document.getElementById('todoList');
    const todos = getStorageData('auctusTodos', []);
    
    // General users see all incomplete tasks
    const incompleteTodos = todos.filter(t => !t.completed);
    
    if (incompleteTodos.length === 0) {
        todoList.innerHTML = '<p class="empty-state">No tasks assigned</p>';
        return;
    }
    
    todoList.innerHTML = incompleteTodos.map(todo => `
        <div class="todo-item" data-id="${todo.id}">
            <div class="todo-content">
                <h4>${todo.title}</h4>
                ${todo.description ? `<p>${todo.description}</p>` : ''}
                <span class="todo-priority ${todo.priority}">${todo.priority}</span>
            </div>
            <div class="todo-actions">
                <button class="btn-primary" onclick="markTaskComplete('${todo.id}')">
                    Mark Complete
                </button>
            </div>
        </div>
    `).join('');
}

function markTaskComplete(todoId) {
    const todos = getStorageData('auctusTodos', []);
    const todo = todos.find(t => t.id === todoId);
    
    if (todo) {
        todo.completed = true;
        saveStorageData('auctusTodos', todos);
        loadTodos();
        updateDashboardStats();
        showToast('Task completed!', 'success');
        
        // Log activity
        const activities = getStorageData('auctusActivity', []);
        activities.unshift({
            id: generateId(),
            title: 'Task Completed',
            description: `${todo.title} marked as complete`,
            date: new Date().toISOString()
        });
        saveStorageData('auctusActivity', activities);
    }
}

// Client List (Limited view - no financial info or actions)
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
        tableBody.innerHTML = '<tr><td colspan="5" class="empty-state">No clients found</td></tr>';
        return;
    }
    
    tableBody.innerHTML = clients.map(client => `
        <tr>
            <td><strong>${client.companyName}</strong></td>
            <td>${client.contactName}</td>
            <td>${client.email}</td>
            <td>${client.website ? `<a href="${client.website}" target="_blank" style="color: var(--primary-orange);">Visit</a>` : 'N/A'}</td>
            <td><span class="status-badge ${client.status}">${client.status}</span></td>
        </tr>
    `).join('');
}

// Make function global
window.markTaskComplete = markTaskComplete;