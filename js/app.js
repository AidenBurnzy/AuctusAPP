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
        
        // Setup role selection buttons
        const adminBtn = document.getElementById('admin-access-btn');
        const employeeBtn = document.getElementById('employee-access-btn');
        
        if (adminBtn && !adminBtn.hasAttribute('data-listener')) {
            adminBtn.addEventListener('click', () => {
                this.showAdminLogin();
            });
            adminBtn.setAttribute('data-listener', 'true');
        }
        
        if (employeeBtn && !employeeBtn.hasAttribute('data-listener')) {
            employeeBtn.addEventListener('click', () => {
                this.enterEmployeeMode();
            });
            employeeBtn.setAttribute('data-listener', 'true');
        }
    }

    showAdminLogin() {
        const modal = document.getElementById('admin-login-modal');
        modal.style.display = 'flex';
        document.getElementById('admin-password').value = '';
        document.getElementById('password-error').style.display = 'none';
        
        // Setup form listener
        const loginForm = document.getElementById('admin-login-form');
        if (loginForm && !loginForm.hasAttribute('data-listener')) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const password = document.getElementById('admin-password').value;
                this.checkAdminPassword(password);
            });
            loginForm.setAttribute('data-listener', 'true');
        }
        
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

        // Navigation items in drawer (mobile)
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.currentTarget.dataset.view;
                this.switchView(view);
            });
        });

        // Navigation buttons in bottom nav (desktop)
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.currentTarget.dataset.view;
                this.switchView(view);
            });
        });

        // Floating menu button (mobile only)
        const floatingBtn = document.getElementById('floating-menu-btn');
        if (floatingBtn) {
            floatingBtn.addEventListener('click', () => {
                this.openNavDrawer();
            });
        }

        // Drawer backdrop
        const backdrop = document.getElementById('nav-drawer-backdrop');
        if (backdrop) {
            backdrop.addEventListener('click', () => {
                this.closeNavDrawer();
            });
        }

        // Drawer handle for swipe
        const drawerHandle = document.getElementById('nav-drawer-handle');
        if (drawerHandle) {
            drawerHandle.addEventListener('click', () => {
                this.closeNavDrawer();
            });
        }

        // Add swipe gesture support for drawer (mobile only)
        this.setupDrawerSwipe();

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
        // Update navigation items in drawer (mobile)
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Update navigation buttons in bottom nav (desktop)
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Set active on both nav systems
        document.querySelectorAll(`[data-view="${viewName}"]`).forEach(btn => {
            btn.classList.add('active');
        });

        // Update views
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });

        const targetView = document.getElementById(`${viewName}-view`);
        targetView.classList.add('active');

        this.currentView = viewName;

        // Close drawer after selection (mobile only)
        this.closeNavDrawer();

        // Load view content
        this.loadViewContent(viewName);
    }

    openNavDrawer() {
        document.getElementById('nav-drawer').classList.add('open');
        document.getElementById('nav-drawer-backdrop').classList.add('active');
        document.getElementById('floating-menu-btn').classList.add('hidden');
    }

    closeNavDrawer() {
        document.getElementById('nav-drawer').classList.remove('open');
        document.getElementById('nav-drawer-backdrop').classList.remove('active');
        document.getElementById('floating-menu-btn').classList.remove('hidden');
    }

    setupDrawerSwipe() {
        const drawer = document.getElementById('nav-drawer');
        const drawerContent = document.getElementById('nav-drawer-content');
        const backdrop = document.getElementById('nav-drawer-backdrop');
        const drawerHandle = document.getElementById('nav-drawer-handle');
        
        // Exit if elements don't exist (desktop)
        if (!drawer || !drawerContent || !backdrop || !drawerHandle) return;
        
        let touchStartY = 0;
        let currentY = 0;
        let isDragging = false;
        let isContentScrolling = false;

        // Override open/close to prevent body scroll
        const originalOpenDrawer = this.openNavDrawer.bind(this);
        this.openNavDrawer = () => {
            originalOpenDrawer();
            document.body.style.overflow = 'hidden';
            document.body.style.touchAction = 'none';
        };

        const originalCloseDrawer = this.closeNavDrawer.bind(this);
        this.closeNavDrawer = () => {
            originalCloseDrawer();
            document.body.style.overflow = '';
            document.body.style.touchAction = '';
            drawer.style.transform = ''; // Reset any transform
            drawer.style.transition = ''; // Reset transition
        };

        // Universal touch handler for the whole drawer
        drawer.addEventListener('touchstart', (e) => {
            touchStartY = e.touches[0].clientY;
            currentY = touchStartY;
            isDragging = false;
            isContentScrolling = false;
            
            // Check if touch started on scrollable content
            const target = e.target;
            if (drawerContent.contains(target) && target !== drawerHandle) {
                // If content is scrollable and not at top, allow scroll
                if (drawerContent.scrollTop > 0) {
                    isContentScrolling = true;
                    return;
                }
            }
            
            isDragging = true;
        }, { passive: true });

        drawer.addEventListener('touchmove', (e) => {
            if (isContentScrolling) {
                // Let content scroll naturally
                return;
            }
            
            if (!isDragging) return;
            
            currentY = e.touches[0].clientY;
            const deltaY = currentY - touchStartY;
            
            // Only handle downward swipes (closing)
            if (deltaY > 0) {
                e.preventDefault();
                e.stopPropagation();
                
                // Disable transition for smooth dragging
                drawer.style.transition = 'none';
                drawer.style.transform = `translateY(${deltaY}px)`;
            }
        }, { passive: false });

        drawer.addEventListener('touchend', (e) => {
            if (isContentScrolling) {
                isContentScrolling = false;
                return;
            }
            
            if (!isDragging) return;
            
            const deltaY = currentY - touchStartY;
            
            // Re-enable transition
            drawer.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            
            // If swiped down more than 100px, close the drawer
            if (deltaY > 100) {
                drawer.style.transform = 'translateY(100%)';
                setTimeout(() => {
                    this.closeNavDrawer();
                }, 300);
            } else {
                // Snap back to open position
                drawer.style.transform = 'translateY(0)';
                setTimeout(() => {
                    drawer.style.transition = '';
                }, 300);
            }
            
            isDragging = false;
        }, { passive: true });

        // Handle content scroll detection
        drawerContent.addEventListener('touchstart', (e) => {
            if (drawerContent.scrollTop > 0) {
                isContentScrolling = true;
            }
        }, { passive: true });

        drawerContent.addEventListener('scroll', () => {
            // If scrolled away from top, enable scrolling mode
            if (drawerContent.scrollTop > 5) {
                isContentScrolling = true;
            }
        }, { passive: true });

        // Prevent backdrop touches from reaching body
        backdrop.addEventListener('touchmove', (e) => {
            e.preventDefault();
            e.stopPropagation();
        }, { passive: false });
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
            case 'notes':
                await window.viewManager.renderNotesView();
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
