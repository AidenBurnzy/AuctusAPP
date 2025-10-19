// Main App Logic
class AuctusApp {
    constructor() {
        this.currentView = 'dashboard';
        this.isAuthenticated = false;
        this.userRole = null; // 'admin' or 'employee'
        this.adminPassword = '0000'; // Simple password for now
        this.init();
    }

    init() {
        // Hide loading screen and show role selection
        setTimeout(() => {
            document.getElementById('loading-screen').style.display = 'none';
            
            // Check if user is already authenticated
            const savedAuth = localStorage.getItem('auctus_auth');
            if (savedAuth) {
                const authData = JSON.parse(savedAuth);
                this.isAuthenticated = authData.isAuthenticated;
                this.userRole = authData.role;
                
                if (this.isAuthenticated && this.userRole === 'admin') {
                    this.showAdminPanel();
                } else if (this.isAuthenticated && this.userRole === 'employee') {
                    this.showEmployeePortal();
                } else {
                    this.showRoleSelection();
                }
            } else {
                this.showRoleSelection();
            }
        }, 1500);
    }

    showRoleSelection() {
        document.getElementById('role-selection').style.display = 'flex';
        document.getElementById('app').style.display = 'none';
        document.getElementById('employee-portal').style.display = 'none';
    }

    showAdminLogin() {
        const modal = document.getElementById('admin-login-modal');
        modal.style.display = 'flex';
        document.getElementById('admin-password').value = '';
        document.getElementById('password-error').style.display = 'none';
        
        // Focus password input
        setTimeout(() => {
            document.getElementById('admin-password').focus();
        }, 100);
    }

    closeAdminLogin() {
        document.getElementById('admin-login-modal').style.display = 'none';
    }

    checkAdminPassword(password) {
        if (password === this.adminPassword) {
            this.isAuthenticated = true;
            this.userRole = 'admin';
            
            // Save auth state
            localStorage.setItem('auctus_auth', JSON.stringify({
                isAuthenticated: true,
                role: 'admin'
            }));
            
            this.closeAdminLogin();
            this.showAdminPanel();
            return true;
        } else {
            document.getElementById('password-error').style.display = 'block';
            document.getElementById('admin-password').value = '';
            document.getElementById('admin-password').focus();
            return false;
        }
    }

    showAdminPanel() {
        document.getElementById('role-selection').style.display = 'none';
        document.getElementById('employee-portal').style.display = 'none';
        document.getElementById('app').style.display = 'flex';
        this.setupEventListeners();
        this.updateStats();
    }

    enterEmployeeMode() {
        this.isAuthenticated = true;
        this.userRole = 'employee';
        
        // Save auth state
        localStorage.setItem('auctus_auth', JSON.stringify({
            isAuthenticated: true,
            role: 'employee'
        }));
        
        this.showEmployeePortal();
    }

    showEmployeePortal() {
        document.getElementById('role-selection').style.display = 'none';
        document.getElementById('app').style.display = 'none';
        document.getElementById('employee-portal').style.display = 'flex';
        
        // Setup employee logout
        document.getElementById('employee-logout-btn').addEventListener('click', () => {
            this.logout();
        });
    }

    logout() {
        this.isAuthenticated = false;
        this.userRole = null;
        localStorage.removeItem('auctus_auth');
        
        // Hide all views
        document.getElementById('app').style.display = 'none';
        document.getElementById('employee-portal').style.display = 'none';
        
        // Show role selection
        this.showRoleSelection();
    }

    setupEventListeners() {
        // Logo home button
        const logoHome = document.getElementById('logo-home');
        if (logoHome && !logoHome.hasAttribute('data-listener')) {
            logoHome.addEventListener('click', () => {
                this.switchView('dashboard');
            });
            logoHome.setAttribute('data-listener', 'true');
        }

        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn && !logoutBtn.hasAttribute('data-listener')) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
            logoutBtn.setAttribute('data-listener', 'true');
        }

        // Admin login form
        const loginForm = document.getElementById('admin-login-form');
        if (loginForm && !loginForm.hasAttribute('data-listener')) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const password = document.getElementById('admin-password').value;
                this.checkAdminPassword(password);
            });
            loginForm.setAttribute('data-listener', 'true');
        }

        // Navigation buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.currentTarget.dataset.view;
                this.switchView(view);
            });
        });

        // Settings button
        document.getElementById('settings-btn').addEventListener('click', () => {
            this.switchView('settings');
        });

        // Quick action buttons
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                this.handleQuickAction(action);
            });
        });
    }

    switchView(viewName) {
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Only update nav button if it exists (settings doesn't have a nav button)
        const navBtn = document.querySelector(`[data-view="${viewName}"]`);
        if (navBtn) {
            navBtn.classList.add('active');
        }

        // Update views
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });

        const targetView = document.getElementById(`${viewName}-view`);
        targetView.classList.add('active');

        this.currentView = viewName;

        // Load view content
        this.loadViewContent(viewName);
    }

    async loadViewContent(viewName) {
        switch(viewName) {
            case 'dashboard':
                await this.updateStats();
                break;
            case 'clients':
                await window.viewManager.renderClientsView();
                break;
            case 'projects':
                await window.viewManager.renderProjectsView();
                break;
            case 'websites':
                await window.viewManager.renderWebsitesView();
                break;
            case 'ideas':
                await window.viewManager.renderIdeasView();
                break;
            case 'finances':
                await window.viewManager.renderFinancesView();
                break;
            case 'settings':
                await window.viewManager.renderSettingsView();
                break;
        }
    }

    handleQuickAction(action) {
        switch(action) {
            case 'add-client':
                window.modalManager.openClientModal();
                break;
            case 'add-project':
                window.modalManager.openProjectModal();
                break;
            case 'add-website':
                window.modalManager.openWebsiteModal();
                break;
            case 'add-idea':
                window.modalManager.openIdeaModal();
                break;
            case 'add-income':
                window.modalManager.openFinanceModal(null, 'income');
                break;
            case 'add-expense':
                window.modalManager.openFinanceModal(null, 'expense');
                break;
        }
    }

    async updateStats() {
        try {
            const clients = await window.storageManager.getClients();
            const projects = await window.storageManager.getProjects();
            const websites = await window.storageManager.getWebsites();
            const ideas = await window.storageManager.getIdeas();
            
            // Get financial data for balance calculation
            const recurringIncome = await window.storageManager.getRecurringIncome();
            const subscriptions = await window.storageManager.getSubscriptions();

            console.log('Stats data:', { clients, projects, websites, ideas, recurringIncome, subscriptions });

            // Calculate financial balance (Net Monthly Income)
            const grossIncome = Array.isArray(recurringIncome) 
                ? recurringIncome
                    .filter(i => i.is_active !== false)
                    .reduce((sum, i) => sum + (parseFloat(i.monthly_payment) || 0), 0) 
                : 0;
            
            const subscriptionsCost = Array.isArray(subscriptions) 
                ? subscriptions
                    .filter(s => s.is_active !== false)
                    .reduce((sum, s) => sum + (parseFloat(s.monthly_cost) || 0), 0) 
                : 0;
            
            const netIncome = grossIncome - subscriptionsCost;

            document.getElementById('total-clients').textContent = Array.isArray(clients) ? clients.length : 0;
            document.getElementById('active-projects').textContent = 
                Array.isArray(projects) ? projects.filter(p => p.status === 'active').length : 0;
            document.getElementById('total-websites').textContent = Array.isArray(websites) ? websites.length : 0;
            document.getElementById('total-ideas').textContent = Array.isArray(ideas) ? ideas.length : 0;
            
            const balanceElement = document.getElementById('finance-balance');
            balanceElement.textContent = `${netIncome >= 0 ? '+' : ''}$${netIncome.toFixed(2)}`;
            balanceElement.style.color = netIncome >= 0 ? '#4CAF50' : '#f44336';
        } catch (error) {
            console.error('Error updating stats:', error);
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new AuctusApp();
});
