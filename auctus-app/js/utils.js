// Auctus Utility Functions
// Shared functions used across the application

// Check authentication and redirect if not logged in
function checkAuth(requiredType = null) {
    const currentUser = JSON.parse(localStorage.getItem('auctusUser') || 'null');
    
    if (!currentUser || currentUser.sessionExpiry < Date.now()) {
        // Session expired or doesn't exist
        localStorage.removeItem('auctusUser');
        window.location.href = 'index.html';
        return null;
    }
    
    // Check if user has required access level
    if (requiredType && currentUser.type !== requiredType) {
        window.location.href = 'index.html';
        return null;
    }
    
    return currentUser;
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Format date
function formatDate(date) {
    return new Intl.DateFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    }).format(new Date(date));
}

// Get or create data storage
function getStorageData(key, defaultValue = []) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
}

// Save data to storage
function saveStorageData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

// Generate unique ID
function generateId() {
    return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Show toast notification
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    // Style the toast
    Object.assign(toast.style, {
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        padding: '16px 24px',
        backgroundColor: type === 'success' ? '#28A745' : type === 'error' ? '#DC3545' : '#FF8C42',
        color: 'white',
        borderRadius: '12px',
        boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
        zIndex: '1000',
        fontFamily: 'Raleway, sans-serif',
        fontWeight: '600',
        animation: 'slideInRight 0.3s ease-out'
    });
    
    document.body.appendChild(toast);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Add toast animations
const toastStyles = document.createElement('style');
toastStyles.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(toastStyles);

// Search filter for tables
function filterTable(searchInput, tableBody) {
    const filter = searchInput.value.toLowerCase();
    const rows = tableBody.getElementsByTagName('tr');
    
    let visibleRows = 0;
    
    for (let row of rows) {
        const text = row.textContent.toLowerCase();
        if (text.includes(filter)) {
            row.style.display = '';
            visibleRows++;
        } else {
            row.style.display = 'none';
        }
    }
    
    // Show empty state if no results
    if (visibleRows === 0 && !tableBody.querySelector('.empty-state')) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = '<td colspan="100" class="empty-state">No results found</td>';
        emptyRow.classList.add('filter-empty-state');
        tableBody.appendChild(emptyRow);
    } else if (visibleRows > 0) {
        const emptyState = tableBody.querySelector('.filter-empty-state');
        if (emptyState) emptyState.remove();
    }
}

// Calculate statistics
function calculateStats() {
    const clients = getStorageData('auctusClients', []);
    const todos = getStorageData('auctusTodos', []);
    
    const activeClients = clients.filter(c => c.status === 'active').length;
    const monthlyRevenue = clients
        .filter(c => c.status === 'active')
        .reduce((sum, c) => sum + parseFloat(c.monthlyFee || 0), 0);
    const pendingTasks = todos.filter(t => !t.completed).length;
    
    return {
        totalClients: clients.length,
        activeClients,
        monthlyRevenue,
        activeProjects: activeClients,
        pendingTasks
    };
}

// Update dashboard statistics
function updateDashboardStats() {
    const stats = calculateStats();
    
    const totalClientsEl = document.getElementById('totalClients');
    const monthlyRevenueEl = document.getElementById('monthlyRevenue');
    const activeProjectsEl = document.getElementById('activeProjects');
    const pendingTasksEl = document.getElementById('pendingTasks');
    const myTasksEl = document.getElementById('myTasks');
    
    if (totalClientsEl) totalClientsEl.textContent = stats.totalClients;
    if (monthlyRevenueEl) monthlyRevenueEl.textContent = formatCurrency(stats.monthlyRevenue);
    if (activeProjectsEl) activeProjectsEl.textContent = stats.activeProjects;
    if (pendingTasksEl) pendingTasksEl.textContent = stats.pendingTasks;
    if (myTasksEl) myTasksEl.textContent = stats.pendingTasks;
}

// Initialize animated background orbs
function initAnimatedBackground() {
    const bg = document.querySelector('.animated-background');
    if (!bg) return;
    
    // Create additional orbs
    for (let i = 1; i <= 3; i++) {
        const orb = document.createElement('div');
        orb.className = `orb orb-${i}`;
        bg.appendChild(orb);
    }
}

// Call on page load
document.addEventListener('DOMContentLoaded', initAnimatedBackground);