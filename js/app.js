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
                } else if (this.isAuthenticated && this.userRole === 'client') {
                    this.showClientPortal();
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
        document.getElementById('client-portal').style.display = 'none';
        
        // Setup role selection buttons
        const adminBtn = document.getElementById('admin-access-btn');
        const clientBtn = document.getElementById('client-access-btn');
        
        if (adminBtn && !adminBtn.hasAttribute('data-listener')) {
            adminBtn.addEventListener('click', () => {
                this.showAdminLogin();
            });
            adminBtn.setAttribute('data-listener', 'true');
        }
        
        if (clientBtn && !clientBtn.hasAttribute('data-listener')) {
            clientBtn.addEventListener('click', () => {
                this.showClientLogin();
            });
            clientBtn.setAttribute('data-listener', 'true');
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

    async checkAdminPassword(password) {
        try {
            // Call the auth endpoint to get JWT token
            const response = await fetch('/.netlify/functions/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });

            if (!response.ok) {
                document.getElementById('password-error').style.display = 'block';
                document.getElementById('admin-password').value = '';
                document.getElementById('admin-password').focus();
                return false;
            }

            const data = await response.json();
            
            // Save JWT token and auth state
            localStorage.setItem('auctus_token', data.token);
            localStorage.setItem('auctus_auth', JSON.stringify({
                isAuthenticated: true,
                role: 'admin'
            }));
            
            this.isAuthenticated = true;
            this.userRole = 'admin';
            
            this.closeAdminLogin();
            this.showAdminPanel();
            return true;
        } catch (error) {
            console.error('Authentication error:', error);
            document.getElementById('password-error').style.display = 'block';
            document.getElementById('password-error').textContent = 'Authentication failed. Please try again.';
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
        
        // Initialize quick note button visibility
        const showQuickNote = localStorage.getItem('show_quick_note') !== 'false';
        const quickNoteBtn = document.querySelector('.quick-note-btn');
        if (quickNoteBtn) {
            quickNoteBtn.style.display = showQuickNote ? 'flex' : 'none';
        }
    }

    showClientLogin() {
        // Create client login modal
        const modalHtml = `
            <div class="modal-overlay" style="display: flex; align-items: center; justify-content: center;">
                <div class="modal" style="max-width: 400px; border-radius: 20px; margin: 2rem;">
                    <div class="modal-header">
                        <h3><i class="fas fa-user-circle"></i> Client Portal Login</h3>
                        <button class="close-btn" onclick="this.closest('.modal-overlay').remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-content">
                        <form id="client-login-form">
                            <div class="form-group">
                                <label>Username</label>
                                <input type="text" class="form-input" id="client-username" required autofocus>
                            </div>
                            <div class="form-group">
                                <label>Password</label>
                                <input type="password" class="form-input" id="client-password" required>
                            </div>
                            <button type="submit" class="btn-primary">
                                <i class="fas fa-sign-in-alt"></i> Login
                            </button>
                        </form>
                        <p style="text-align: center; margin-top: 1rem; color: var(--text-secondary); font-size: 0.875rem;">
                            <i class="fas fa-info-circle"></i> Contact Auctus for login credentials
                        </p>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Handle client login
        document.getElementById('client-login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('client-username').value;
            const password = document.getElementById('client-password').value;
            
            try {
                const response = await fetch(`/.netlify/functions/client-portal-users?username=${username}&password=${password}`);
                const data = await response.json();
                
                if (data.success && data.user) {
                    // Save client session
                    this.clientData = data.user;
                    localStorage.setItem('auctus_auth', JSON.stringify({
                        isAuthenticated: true,
                        role: 'client',
                        clientId: data.user.client_id,
                        clientName: data.user.client_name
                    }));
                    
                    document.querySelector('.modal-overlay').remove();
                    this.showClientPortal();
                } else {
                    alert('Invalid username or password');
                }
            } catch (error) {
                console.error('Login error:', error);
                alert('Login failed. Please try again.');
            }
        });
    }

    async showClientPortal() {
        this.isAuthenticated = true;
        this.userRole = 'client';
        
        document.getElementById('role-selection').style.display = 'none';
        document.getElementById('app').style.display = 'none';
        document.getElementById('client-portal').style.display = 'flex';
        
        // Get client data from localStorage
        const authData = JSON.parse(localStorage.getItem('auctus_auth'));
        const clientName = authData?.clientName || 'Client';
        
        // Update client name display
        document.getElementById('client-name-display').textContent = clientName;
        
        // Setup client logout
        const logoutBtn = document.getElementById('client-logout-btn');
        if (logoutBtn && !logoutBtn.hasAttribute('data-listener')) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
            logoutBtn.setAttribute('data-listener', 'true');
        }
        
        // Render client portal content
        await this.renderClientPortalContent();
    }

    async renderClientPortalContent() {
        const authData = JSON.parse(localStorage.getItem('auctus_auth'));
        const clientId = authData?.clientId;
        
        if (!clientId) {
            document.getElementById('client-portal-content').innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Session Error</h3>
                    <p>Please log in again</p>
                </div>
            `;
            return;
        }
        
        try {
            // Fetch client's projects
            const projectsResponse = await fetch('/.netlify/functions/projects');
            const allProjects = await projectsResponse.json();
            const clientProjects = allProjects.filter(p => p.client_id == clientId);
            
            // Fetch client updates
            const updatesResponse = await fetch(`/.netlify/functions/client-updates?client_id=${clientId}`);
            const updates = await updatesResponse.json();
            
            const content = `
                <div class="client-portal-dashboard">
                    <h1 style="margin-bottom: 2rem;">
                        <i class="fas fa-home"></i> Welcome Back!
                    </h1>
                    
                    <!-- Projects Section -->
                    <div class="settings-card" style="margin-bottom: 2rem;">
                        <div class="settings-card-header">
                            <i class="fas fa-project-diagram"></i>
                            <h3>Your Projects</h3>
                        </div>
                        <div class="settings-card-body">
                            ${clientProjects.length > 0 ? `
                                <div class="client-projects-grid">
                                    ${clientProjects.map(project => `
                                        <div class="client-project-card">
                                            <div class="project-header">
                                                <h4>${project.name}</h4>
                                                <span class="status-badge status-${project.status}">${project.status}</span>
                                            </div>
                                            ${project.description ? `<p>${project.description}</p>` : ''}
                                            <div class="project-meta">
                                                <div><i class="fas fa-calendar"></i> ${new Date(project.start_date).toLocaleDateString()}</div>
                                                ${project.end_date ? `<div><i class="fas fa-flag-checkered"></i> ${new Date(project.end_date).toLocaleDateString()}</div>` : ''}
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : `
                                <div class="empty-state">
                                    <i class="fas fa-project-diagram"></i>
                                    <p>No projects yet</p>
                                </div>
                            `}
                        </div>
                    </div>
                    
                    <!-- Updates Section -->
                    <div class="settings-card" style="margin-bottom: 2rem;">
                        <div class="settings-card-header">
                            <i class="fas fa-bullhorn"></i>
                            <h3>Updates from Auctus</h3>
                        </div>
                        <div class="settings-card-body">
                            ${updates.length > 0 ? `
                                <div class="updates-list">
                                    ${updates.map(update => `
                                        <div class="update-item">
                                            <div class="update-header">
                                                <h4>${update.title}</h4>
                                                <span class="update-date">${new Date(update.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <p>${update.content}</p>
                                            <div class="update-footer">
                                                <small><i class="fas fa-user"></i> ${update.created_by}</small>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : `
                                <div class="empty-state">
                                    <i class="fas fa-inbox"></i>
                                    <p>No updates yet</p>
                                </div>
                            `}
                        </div>
                    </div>
                    
                    <!-- Message Section -->
                    <div class="settings-card">
                        <div class="settings-card-header">
                            <i class="fas fa-comments"></i>
                            <h3>Send us a Message</h3>
                        </div>
                        <div class="settings-card-body">
                            <form id="client-message-form">
                                <div class="form-group">
                                    <label>Subject (Optional)</label>
                                    <input type="text" class="form-input" id="message-subject" placeholder="Message subject">
                                </div>
                                <div class="form-group">
                                    <label>Message *</label>
                                    <textarea class="form-textarea" id="message-content" rows="4" placeholder="Write your message here..." required></textarea>
                                </div>
                                <button type="submit" class="btn-primary">
                                    <i class="fas fa-paper-plane"></i> Send Message
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('client-portal-content').innerHTML = content;
            
            // Setup message form
            document.getElementById('client-message-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                const subject = document.getElementById('message-subject').value;
                const message = document.getElementById('message-content').value;
                
                try {
                    const response = await fetch('/.netlify/functions/client-messages', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            client_id: clientId,
                            subject: subject || 'No Subject',
                            message: message,
                            created_by: authData.clientName
                        })
                    });
                    
                    if (response.ok) {
                        alert('Message sent successfully!');
                        document.getElementById('message-subject').value = '';
                        document.getElementById('message-content').value = '';
                    } else {
                        alert('Failed to send message');
                    }
                } catch (error) {
                    console.error('Error sending message:', error);
                    alert('Failed to send message');
                }
            });
            
        } catch (error) {
            console.error('Error loading client portal:', error);
            document.getElementById('client-portal-content').innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error Loading Portal</h3>
                    <p>Please try refreshing the page</p>
                </div>
            `;
        }
    }

    setCurrentUser(userName) {
        localStorage.setItem('auctus_current_user', userName);
        
        // Update settings display
        const userDisplay = document.getElementById('current-user-display');
        if (userDisplay) {
            userDisplay.textContent = userName;
        }
        
        // Update button states
        document.querySelectorAll('.user-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.closest('.user-btn').classList.add('active');
        
        // Show success notification
        this.showNotification(`Profile set to ${userName} ✓`);
        
        // If on notes view, refresh it
        if (this.currentView === 'notes') {
            window.viewManager.renderNotesView();
        }
    }

    toggleQuickNoteButton(isVisible) {
        localStorage.setItem('show_quick_note', isVisible);
        const quickNoteBtn = document.querySelector('.quick-note-btn');
        if (quickNoteBtn) {
            quickNoteBtn.style.display = isVisible ? 'flex' : 'none';
        }
        this.showNotification(isVisible ? 'Quick note button shown ✓' : 'Quick note button hidden ✓');
    }

    logout() {
        this.isAuthenticated = false;
        this.userRole = null;
        this.clientData = null;
        localStorage.removeItem('auctus_auth');
        localStorage.removeItem('auctus_token');
        
        // Hide all views
        document.getElementById('app').style.display = 'none';
        document.getElementById('client-portal').style.display = 'none';
        
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

        // Quick Note button
        const quickNoteBtn = document.getElementById('quick-note-btn');
        if (quickNoteBtn) {
            quickNoteBtn.addEventListener('click', () => {
                this.openQuickNote();
            });
        }

        // Quick Note modal close
        const quickNoteClose = document.getElementById('quick-note-close');
        const quickNoteOverlay = document.getElementById('quick-note-overlay');
        if (quickNoteClose) {
            quickNoteClose.addEventListener('click', () => {
                this.closeQuickNote();
            });
        }
        if (quickNoteOverlay) {
            quickNoteOverlay.addEventListener('click', () => {
                this.closeQuickNote();
            });
        }

        // Quick Note form submission
        const quickNoteForm = document.getElementById('quick-note-form');
        if (quickNoteForm) {
            quickNoteForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.saveQuickNote();
            });
        }

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

    openQuickNote() {
        const modal = document.getElementById('quick-note-modal');
        const input = document.getElementById('quick-note-input');
        
        modal.classList.add('active');
        
        // Focus input after animation
        setTimeout(() => {
            if (input) input.focus();
        }, 300);
        
        // Lock body scroll
        document.body.style.overflow = 'hidden';
    }

    closeQuickNote() {
        const modal = document.getElementById('quick-note-modal');
        const input = document.getElementById('quick-note-input');
        
        modal.classList.remove('active');
        
        // Clear input
        if (input) input.value = '';
        
        // Unlock body scroll
        document.body.style.overflow = '';
    }

    async saveQuickNote() {
        const input = document.getElementById('quick-note-input');
        const content = input.value.trim();
        
        if (!content) {
            alert('Please enter a note!');
            return;
        }
        
        try {
            // Get current user from profile
            const currentUser = localStorage.getItem('auctus_current_user') || 'Both';
            
            if (!localStorage.getItem('auctus_current_user')) {
                alert('Please set your profile in Settings first (Aiden or Nick)');
                this.closeQuickNote();
                this.switchView('settings');
                return;
            }
            
            // Create note object
            const note = {
                title: 'Quick Note',
                content: content,
                priority: 'medium',
                created_by: currentUser
            };
            
            // Save to database
            await window.storageManager.addNote(note);
            
            // Close modal
            this.closeQuickNote();
            
            // Show success feedback
            this.showNotification('Note saved successfully! 📝');
            
            // If currently on notes view, refresh it
            if (this.currentView === 'notes') {
                await window.viewManager.renderNotesView();
            }
        } catch (error) {
            console.error('Error saving quick note:', error);
            alert('Failed to save note. Please try again.');
        }
    }

    showNotification(message) {
        // Create temporary notification
        const notification = document.createElement('div');
        notification.className = 'quick-notification';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Trigger animation
        setTimeout(() => notification.classList.add('show'), 10);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    setupDrawerSwipe() {
        const drawer = document.getElementById('nav-drawer');
        const backdrop = document.getElementById('nav-drawer-backdrop');
        
        // Exit if elements don't exist (desktop)
        if (!drawer || !backdrop) return;
        
        let startY = 0;
        let currentY = 0;
        let isDragging = false;

        // Override open/close to prevent body scroll
        const originalOpenDrawer = this.openNavDrawer.bind(this);
        this.openNavDrawer = () => {
            originalOpenDrawer();
            // Lock the body
            const scrollY = window.scrollY;
            document.body.style.position = 'fixed';
            document.body.style.top = `-${scrollY}px`;
            document.body.style.width = '100%';
        };

        const originalCloseDrawer = this.closeNavDrawer.bind(this);
        this.closeNavDrawer = () => {
            // Restore body scroll position
            const scrollY = document.body.style.top;
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.width = '';
            window.scrollTo(0, parseInt(scrollY || '0') * -1);
            
            // Clean up drawer
            drawer.style.transform = '';
            drawer.style.transition = '';
            
            originalCloseDrawer();
        };

        // Simple touch handling on the entire drawer
        const handleTouchStart = (e) => {
            startY = e.touches[0].clientY;
            currentY = startY;
            isDragging = true;
        };

        const handleTouchMove = (e) => {
            if (!isDragging) return;
            
            currentY = e.touches[0].clientY;
            const deltaY = currentY - startY;
            
            // Only allow dragging down
            if (deltaY > 0) {
                e.preventDefault();
                drawer.style.transition = 'none';
                drawer.style.transform = `translateY(${deltaY}px)`;
            }
        };

        const handleTouchEnd = (e) => {
            if (!isDragging) return;
            
            const deltaY = currentY - startY;
            drawer.style.transition = 'transform 0.3s ease-out';
            
            // Close if dragged more than 100px
            if (deltaY > 100) {
                drawer.style.transform = 'translateY(100%)';
                setTimeout(() => this.closeNavDrawer(), 300);
            } else {
                // Snap back
                drawer.style.transform = 'translateY(0)';
            }
            
            isDragging = false;
        };

        // Attach to drawer with capture phase to intercept before children
        drawer.addEventListener('touchstart', handleTouchStart, { passive: false, capture: true });
        drawer.addEventListener('touchmove', handleTouchMove, { passive: false, capture: true });
        drawer.addEventListener('touchend', handleTouchEnd, { passive: false, capture: true });

        // Prevent backdrop touches
        backdrop.addEventListener('touchmove', (e) => {
            e.preventDefault();
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
