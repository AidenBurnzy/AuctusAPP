// Check authentication
function checkAuth(requiredRole = null) {
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    const userRole = localStorage.getItem('userRole');
    
    if (!isAuthenticated) {
        window.location.href = 'login.html';
        return false;
    }
    
    // If a specific role is required, check it
    if (requiredRole && userRole !== requiredRole) {
        window.location.href = 'index.html';
        return false;
    }
    
    return { isAuthenticated, userRole };
}

// Logout function (Auth0)
async function logout() {
    // Call the logout function from auth.js if available
    if (typeof window.logout === 'function') {
        await window.logout();
    } else {
        // Fallback if auth.js is not loaded
        localStorage.removeItem('auth0_token');
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('userRole');
        localStorage.removeItem('currentUserId');
        localStorage.removeItem('username');
        localStorage.removeItem('userEmail');
        window.location.href = 'index.html';
    }
}

// Local Storage helpers
function getStorageData(key, defaultValue = []) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
        console.error('Error reading from localStorage:', error);
        return defaultValue;
    }
}

function saveStorageData(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.error('Error saving to localStorage:', error);
    }
}

// Generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Format date to readable string
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = months[date.getMonth()];
        const day = date.getDate();
        const year = date.getFullYear();
        return `${month} ${day}, ${year}`;
    } catch (error) {
        console.error('Date formatting error:', error);
        return 'N/A';
    }
}

// Show toast notification
function showToast(message, type = 'success') {
    // Remove any existing toasts
    const existingToasts = document.querySelectorAll('.toast');
    existingToasts.forEach(t => t.remove());
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    // Add toast styles if not already added
    if (!document.getElementById('toast-styles')) {
        const style = document.createElement('style');
        style.id = 'toast-styles';
        style.textContent = `
            .toast {
                position: fixed;
                top: 20px;
                right: 20px;
                background: white;
                padding: 16px 24px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 10000;
                transform: translateX(400px);
                transition: transform 0.3s ease;
                font-weight: 500;
            }
            .toast.show {
                transform: translateX(0);
            }
            .toast.toast-success {
                border-left: 4px solid #28A745;
                color: #28A745;
            }
            .toast.toast-error {
                border-left: 4px solid #DC3545;
                color: #DC3545;
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                document.body.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// Validate email
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Get status badge color
function getStatusColor(status) {
    const colors = {
        'active': '#10b981',
        'pending': '#f59e0b',
        'inactive': '#ef4444'
    };
    return colors[status] || '#6b7280';
}

// Filter table rows based on search input
function filterTable(searchInput, tableBody) {
    const searchTerm = searchInput.value.toLowerCase();
    const rows = tableBody.querySelectorAll('tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

// Update dashboard statistics
function updateDashboardStats() {
    const clients = getStorageData('auctusClients', []);
    const todos = getStorageData('auctusTodos', []);
    
    // Update total clients
    const totalClientsEl = document.getElementById('totalClients');
    if (totalClientsEl) {
        totalClientsEl.textContent = clients.length;
    }
    
    // Update monthly revenue
    const monthlyRevenueEl = document.getElementById('monthlyRevenue');
    if (monthlyRevenueEl) {
        const totalRevenue = clients
            .filter(c => c.status === 'active')
            .reduce((sum, c) => sum + parseFloat(c.monthlyFee || 0), 0);
        monthlyRevenueEl.textContent = formatCurrency(totalRevenue);
    }
    
    // Update active projects
    const activeProjectsEl = document.getElementById('activeProjects');
    if (activeProjectsEl) {
        const activeClients = clients.filter(c => c.status === 'active').length;
        activeProjectsEl.textContent = activeClients;
    }
    
    // Update pending tasks
    const pendingTasksEl = document.getElementById('pendingTasks');
    if (pendingTasksEl) {
        const incompleteTasks = todos.filter(t => !t.completed).length;
        pendingTasksEl.textContent = incompleteTasks;
    }
    
    // Update my tasks (for general dashboard)
    const myTasksEl = document.getElementById('myTasks');
    if (myTasksEl) {
        const incompleteTasks = todos.filter(t => !t.completed).length;
        myTasksEl.textContent = incompleteTasks;
    }
}