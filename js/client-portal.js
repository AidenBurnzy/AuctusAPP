// Client Portal Manager
class ClientPortalManager {
    constructor() {
        this.currentView = 'dashboard';
        this.clientData = null;
    }

    async initialize() {
        const authData = JSON.parse(localStorage.getItem('auctus_auth'));
        if (!authData || !authData.clientId) {
            this.showError('Please log in again');
            return;
        }

        try {
            // Fetch client data
            const clientResponse = await fetch(`/.netlify/functions/clients?id=${authData.clientId}`);
            this.clientData = await clientResponse.json();
            
            this.renderNavigation();
            this.renderView(this.currentView);
        } catch (error) {
            console.error('Error initializing client portal:', error);
            this.showError('Failed to load portal data');
        }
    }

    renderNavigation() {
        const navHtml = `
            <div class="client-portal-nav">
                <button class="client-nav-btn ${this.currentView === 'dashboard' ? 'active' : ''}" onclick="window.clientPortal.switchView('dashboard')">
                    <i class="fas fa-home"></i>
                    <span>Dashboard</span>
                </button>
                <button class="client-nav-btn ${this.currentView === 'projects' ? 'active' : ''}" onclick="window.clientPortal.switchView('projects')">
                    <i class="fas fa-project-diagram"></i>
                    <span>My Projects</span>
                </button>
                <button class="client-nav-btn ${this.currentView === 'updates' ? 'active' : ''}" onclick="window.clientPortal.switchView('updates')">
                    <i class="fas fa-bullhorn"></i>
                    <span>Updates</span>
                </button>
                <button class="client-nav-btn ${this.currentView === 'messages' ? 'active' : ''}" onclick="window.clientPortal.switchView('messages')">
                    <i class="fas fa-comments"></i>
                    <span>Messages</span>
                </button>
                <button class="client-nav-btn ${this.currentView === 'files' ? 'active' : ''}" onclick="window.clientPortal.switchView('files')">
                    <i class="fas fa-folder"></i>
                    <span>Files</span>
                </button>
                <button class="client-nav-btn ${this.currentView === 'invoices' ? 'active' : ''}" onclick="window.clientPortal.switchView('invoices')">
                    <i class="fas fa-file-invoice-dollar"></i>
                    <span>Invoices</span>
                </button>
                <button class="client-nav-btn ${this.currentView === 'profile' ? 'active' : ''}" onclick="window.clientPortal.switchView('profile')">
                    <i class="fas fa-user-circle"></i>
                    <span>Profile</span>
                </button>
            </div>
        `;

        const container = document.getElementById('client-portal-content');
        const existingNav = container.querySelector('.client-portal-nav');
        if (existingNav) {
            existingNav.remove();
        }
        container.insertAdjacentHTML('afterbegin', navHtml);
    }

    switchView(view) {
        this.currentView = view;
        this.renderNavigation();
        this.renderView(view);
    }

    async renderView(view) {
        const contentArea = document.getElementById('client-portal-main-content') || this.createMainContentArea();
        
        switch(view) {
            case 'dashboard':
                await this.renderDashboard(contentArea);
                break;
            case 'projects':
                await this.renderProjects(contentArea);
                break;
            case 'updates':
                await this.renderUpdates(contentArea);
                break;
            case 'messages':
                await this.renderMessages(contentArea);
                break;
            case 'files':
                await this.renderFiles(contentArea);
                break;
            case 'invoices':
                await this.renderInvoices(contentArea);
                break;
            case 'profile':
                await this.renderProfile(contentArea);
                break;
        }
    }

    createMainContentArea() {
        const container = document.getElementById('client-portal-content');
        const mainContent = document.createElement('div');
        mainContent.id = 'client-portal-main-content';
        mainContent.className = 'client-portal-main-content';
        container.appendChild(mainContent);
        return mainContent;
    }

    async renderDashboard(container) {
        const authData = JSON.parse(localStorage.getItem('auctus_auth'));
        const clientId = authData.clientId;

        try {
            // Fetch all data
            const [projectsRes, updatesRes, messagesRes] = await Promise.all([
                fetch('/.netlify/functions/projects'),
                fetch(`/.netlify/functions/client-updates?client_id=${clientId}`),
                fetch(`/.netlify/functions/client-messages?client_id=${clientId}`)
            ]);

            const allProjects = await projectsRes.json();
            const updates = await updatesRes.json();
            const messages = await messagesRes.json();

            const clientProjects = allProjects.filter(p => p.client_id == clientId);
            const activeProjects = clientProjects.filter(p => p.status === 'In Progress' || p.status === 'Planning');
            const recentUpdates = updates.slice(0, 3);

            container.innerHTML = `
                <div class="client-dashboard">
                    <div class="dashboard-header">
                        <h1><i class="fas fa-home"></i> Welcome back, ${this.clientData?.name || 'Client'}!</h1>
                        <p class="dashboard-subtitle">Here's what's happening with your projects</p>
                    </div>

                    <!-- Stats Cards -->
                    <div class="client-stats-grid">
                        <div class="client-stat-card">
                            <div class="stat-icon" style="background: rgba(108, 99, 255, 0.2);">
                                <i class="fas fa-project-diagram" style="color: var(--primary-color);"></i>
                            </div>
                            <div class="stat-details">
                                <div class="stat-value">${clientProjects.length}</div>
                                <div class="stat-label">Total Projects</div>
                            </div>
                        </div>
                        <div class="client-stat-card">
                            <div class="stat-icon" style="background: rgba(76, 175, 80, 0.2);">
                                <i class="fas fa-tasks" style="color: var(--secondary-color);"></i>
                            </div>
                            <div class="stat-details">
                                <div class="stat-value">${activeProjects.length}</div>
                                <div class="stat-label">Active Projects</div>
                            </div>
                        </div>
                        <div class="client-stat-card">
                            <div class="stat-icon" style="background: rgba(255, 152, 0, 0.2);">
                                <i class="fas fa-bullhorn" style="color: var(--warning-color);"></i>
                            </div>
                            <div class="stat-details">
                                <div class="stat-value">${updates.length}</div>
                                <div class="stat-label">Updates</div>
                            </div>
                        </div>
                        <div class="client-stat-card">
                            <div class="stat-icon" style="background: rgba(33, 150, 243, 0.2);">
                                <i class="fas fa-comments" style="color: #2196F3;"></i>
                            </div>
                            <div class="stat-details">
                                <div class="stat-value">${messages.length}</div>
                                <div class="stat-label">Messages</div>
                            </div>
                        </div>
                    </div>

                    <!-- Active Projects -->
                    <div class="dashboard-section">
                        <div class="section-header">
                            <h2><i class="fas fa-tasks"></i> Active Projects</h2>
                            <button class="text-btn" onclick="window.clientPortal.switchView('projects')">
                                View All <i class="fas fa-arrow-right"></i>
                            </button>
                        </div>
                        ${activeProjects.length > 0 ? `
                            <div class="projects-grid">
                                ${activeProjects.slice(0, 3).map(project => this.renderProjectCard(project)).join('')}
                            </div>
                        ` : `
                            <div class="empty-state-small">
                                <i class="fas fa-project-diagram"></i>
                                <p>No active projects at the moment</p>
                            </div>
                        `}
                    </div>

                    <!-- Recent Updates -->
                    <div class="dashboard-section">
                        <div class="section-header">
                            <h2><i class="fas fa-bullhorn"></i> Recent Updates</h2>
                            <button class="text-btn" onclick="window.clientPortal.switchView('updates')">
                                View All <i class="fas fa-arrow-right"></i>
                            </button>
                        </div>
                        ${recentUpdates.length > 0 ? `
                            <div class="updates-feed">
                                ${recentUpdates.map(update => this.renderUpdateItem(update)).join('')}
                            </div>
                        ` : `
                            <div class="empty-state-small">
                                <i class="fas fa-inbox"></i>
                                <p>No updates yet</p>
                            </div>
                        `}
                    </div>

                    <!-- Quick Actions -->
                    <div class="dashboard-section">
                        <div class="section-header">
                            <h2><i class="fas fa-bolt"></i> Quick Actions</h2>
                        </div>
                        <div class="quick-actions-grid">
                            <button class="quick-action-btn" onclick="window.clientPortal.switchView('messages')">
                                <i class="fas fa-paper-plane"></i>
                                <span>Send Message</span>
                            </button>
                            <button class="quick-action-btn" onclick="window.clientPortal.switchView('projects')">
                                <i class="fas fa-eye"></i>
                                <span>View Projects</span>
                            </button>
                            <button class="quick-action-btn" onclick="window.clientPortal.switchView('files')">
                                <i class="fas fa-upload"></i>
                                <span>Upload File</span>
                            </button>
                            <button class="quick-action-btn" onclick="window.clientPortal.switchView('invoices')">
                                <i class="fas fa-receipt"></i>
                                <span>View Invoices</span>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error rendering dashboard:', error);
            this.showError('Failed to load dashboard');
        }
    }

    async renderProjects(container) {
        const authData = JSON.parse(localStorage.getItem('auctus_auth'));
        const clientId = authData.clientId;

        try {
            const response = await fetch('/.netlify/functions/projects');
            const allProjects = await response.json();
            const clientProjects = allProjects.filter(p => p.client_id == clientId);

            // Group projects by status
            const grouped = {
                'Planning': [],
                'In Progress': [],
                'Completed': [],
                'On Hold': []
            };

            clientProjects.forEach(project => {
                if (grouped[project.status]) {
                    grouped[project.status].push(project);
                }
            });

            container.innerHTML = `
                <div class="client-projects-view">
                    <div class="view-header">
                        <h1><i class="fas fa-project-diagram"></i> My Projects</h1>
                        <p class="view-subtitle">Track the progress of all your projects</p>
                    </div>

                    ${Object.entries(grouped).map(([status, projects]) => `
                        <div class="project-group">
                            <h2 class="group-title">
                                <span class="status-badge status-${status.toLowerCase().replace(' ', '-')}">${status}</span>
                                <span class="count-badge">${projects.length}</span>
                            </h2>
                            ${projects.length > 0 ? `
                                <div class="projects-grid">
                                    ${projects.map(project => this.renderDetailedProjectCard(project)).join('')}
                                </div>
                            ` : `
                                <div class="empty-state-small">
                                    <p>No projects in this stage</p>
                                </div>
                            `}
                        </div>
                    `).join('')}

                    ${clientProjects.length === 0 ? `
                        <div class="empty-state">
                            <i class="fas fa-project-diagram"></i>
                            <h3>No Projects Yet</h3>
                            <p>We'll add your projects here as they begin</p>
                        </div>
                    ` : ''}
                </div>
            `;
        } catch (error) {
            console.error('Error rendering projects:', error);
            this.showError('Failed to load projects');
        }
    }

    async renderUpdates(container) {
        const authData = JSON.parse(localStorage.getItem('auctus_auth'));
        const clientId = authData.clientId;

        try {
            const response = await fetch(`/.netlify/functions/client-updates?client_id=${clientId}`);
            const updates = await response.json();

            container.innerHTML = `
                <div class="client-updates-view">
                    <div class="view-header">
                        <h1><i class="fas fa-bullhorn"></i> Updates from Auctus</h1>
                        <p class="view-subtitle">Stay informed about your projects</p>
                    </div>

                    ${updates.length > 0 ? `
                        <div class="updates-timeline">
                            ${updates.map(update => `
                                <div class="timeline-item">
                                    <div class="timeline-marker">
                                        <i class="fas fa-circle"></i>
                                    </div>
                                    <div class="timeline-content">
                                        <div class="update-card">
                                            <div class="update-header">
                                                <h3>${update.title}</h3>
                                                <span class="update-date">
                                                    <i class="fas fa-calendar"></i>
                                                    ${new Date(update.created_at).toLocaleDateString('en-US', { 
                                                        year: 'numeric', 
                                                        month: 'long', 
                                                        day: 'numeric' 
                                                    })}
                                                </span>
                                            </div>
                                            <div class="update-body">
                                                <p>${update.content}</p>
                                            </div>
                                            <div class="update-footer">
                                                <span class="update-author">
                                                    <i class="fas fa-user"></i> ${update.created_by}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : `
                        <div class="empty-state">
                            <i class="fas fa-inbox"></i>
                            <h3>No Updates Yet</h3>
                            <p>We'll post updates about your projects here</p>
                        </div>
                    `}
                </div>
            `;
        } catch (error) {
            console.error('Error rendering updates:', error);
            this.showError('Failed to load updates');
        }
    }

    async renderMessages(container) {
        const authData = JSON.parse(localStorage.getItem('auctus_auth'));
        const clientId = authData.clientId;

        try {
            const response = await fetch(`/.netlify/functions/client-messages?client_id=${clientId}`);
            const messages = await response.json();

            container.innerHTML = `
                <div class="client-messages-view">
                    <div class="view-header">
                        <h1><i class="fas fa-comments"></i> Messages</h1>
                        <p class="view-subtitle">Communicate with the Auctus team</p>
                    </div>

                    <div class="messages-layout">
                        <!-- New Message Form -->
                        <div class="message-compose-card">
                            <h2><i class="fas fa-paper-plane"></i> Send a Message</h2>
                            <form id="client-message-form" class="message-form">
                                <div class="form-group">
                                    <label for="message-subject">Subject</label>
                                    <input 
                                        type="text" 
                                        class="form-input" 
                                        id="message-subject" 
                                        placeholder="What's this about?"
                                    >
                                </div>
                                <div class="form-group">
                                    <label for="message-content">Message *</label>
                                    <textarea 
                                        class="form-textarea" 
                                        id="message-content" 
                                        rows="6" 
                                        placeholder="Write your message here..."
                                        required
                                    ></textarea>
                                </div>
                                <button type="submit" class="btn-primary">
                                    <i class="fas fa-paper-plane"></i> Send Message
                                </button>
                            </form>
                        </div>

                        <!-- Message History -->
                        <div class="message-history-card">
                            <h2><i class="fas fa-history"></i> Message History</h2>
                            ${messages.length > 0 ? `
                                <div class="messages-list">
                                    ${messages.map(msg => `
                                        <div class="message-item ${msg.is_read ? 'read' : 'unread'}">
                                            <div class="message-header">
                                                <div class="message-subject">
                                                    ${!msg.is_read ? '<span class="unread-dot"></span>' : ''}
                                                    <strong>${msg.subject || 'No Subject'}</strong>
                                                </div>
                                                <span class="message-date">
                                                    ${new Date(msg.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p class="message-preview">${msg.message}</p>
                                            <div class="message-footer">
                                                <span class="message-author">
                                                    <i class="fas fa-user"></i> You
                                                </span>
                                                ${msg.is_read ? 
                                                    '<span class="read-status"><i class="fas fa-check-double"></i> Read</span>' : 
                                                    '<span class="unread-status"><i class="fas fa-envelope"></i> Sent</span>'
                                                }
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : `
                                <div class="empty-state-small">
                                    <i class="fas fa-inbox"></i>
                                    <p>No messages yet</p>
                                </div>
                            `}
                        </div>
                    </div>
                </div>
            `;

            // Setup message form
            document.getElementById('client-message-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.sendMessage(clientId);
            });
        } catch (error) {
            console.error('Error rendering messages:', error);
            this.showError('Failed to load messages');
        }
    }

    async renderFiles(container) {
        container.innerHTML = `
            <div class="client-files-view">
                <div class="view-header">
                    <h1><i class="fas fa-folder"></i> Files & Documents</h1>
                    <p class="view-subtitle">Access your project files and resources</p>
                </div>

                <div class="files-coming-soon">
                    <div class="feature-preview-card">
                        <i class="fas fa-cloud-upload-alt"></i>
                        <h2>File Sharing Coming Soon</h2>
                        <p>We're working on a secure way for you to:</p>
                        <ul class="feature-list">
                            <li><i class="fas fa-check"></i> Upload documents and files</li>
                            <li><i class="fas fa-check"></i> Download project deliverables</li>
                            <li><i class="fas fa-check"></i> Share assets with the team</li>
                            <li><i class="fas fa-check"></i> View file history and versions</li>
                        </ul>
                        <p style="margin-top: 1.5rem; color: var(--text-secondary);">
                            In the meantime, you can share files via messages or email.
                        </p>
                    </div>
                </div>
            </div>
        `;
    }

    async renderInvoices(container) {
        const authData = JSON.parse(localStorage.getItem('auctus_auth'));
        const clientId = authData.clientId;

        try {
            // Fetch finances/invoices related to this client
            const response = await fetch('/.netlify/functions/finances');
            const finances = await response.json();
            const clientInvoices = finances.filter(f => 
                f.type === 'Income' && 
                f.client_id == clientId
            );

            container.innerHTML = `
                <div class="client-invoices-view">
                    <div class="view-header">
                        <h1><i class="fas fa-file-invoice-dollar"></i> Invoices & Payments</h1>
                        <p class="view-subtitle">View your billing history</p>
                    </div>

                    ${clientInvoices.length > 0 ? `
                        <div class="invoices-grid">
                            ${clientInvoices.map(invoice => `
                                <div class="invoice-card">
                                    <div class="invoice-header">
                                        <h3>
                                            <i class="fas fa-file-invoice"></i>
                                            ${invoice.description || 'Invoice'}
                                        </h3>
                                        <span class="invoice-amount" style="color: var(--secondary-color);">
                                            $${parseFloat(invoice.amount).toFixed(2)}
                                        </span>
                                    </div>
                                    <div class="invoice-details">
                                        <div class="invoice-detail-row">
                                            <span><i class="fas fa-calendar"></i> Date:</span>
                                            <span>${new Date(invoice.date).toLocaleDateString()}</span>
                                        </div>
                                        ${invoice.category ? `
                                            <div class="invoice-detail-row">
                                                <span><i class="fas fa-tag"></i> Category:</span>
                                                <span>${invoice.category}</span>
                                            </div>
                                        ` : ''}
                                    </div>
                                </div>
                            `).join('')}
                        </div>

                        <div class="invoice-summary-card">
                            <h3>Summary</h3>
                            <div class="summary-row">
                                <span>Total Invoiced:</span>
                                <strong style="color: var(--secondary-color);">
                                    $${clientInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount), 0).toFixed(2)}
                                </strong>
                            </div>
                        </div>
                    ` : `
                        <div class="empty-state">
                            <i class="fas fa-file-invoice"></i>
                            <h3>No Invoices Yet</h3>
                            <p>Your billing information will appear here</p>
                        </div>
                    `}
                </div>
            `;
        } catch (error) {
            console.error('Error rendering invoices:', error);
            this.showError('Failed to load invoices');
        }
    }

    async renderProfile(container) {
        const authData = JSON.parse(localStorage.getItem('auctus_auth'));

        container.innerHTML = `
            <div class="client-profile-view">
                <div class="view-header">
                    <h1><i class="fas fa-user-circle"></i> My Profile</h1>
                    <p class="view-subtitle">Manage your account information</p>
                </div>

                <div class="profile-layout">
                    <!-- Account Info -->
                    <div class="profile-card">
                        <h2><i class="fas fa-building"></i> Company Information</h2>
                        <div class="profile-info">
                            <div class="info-row">
                                <span class="info-label">Name:</span>
                                <span class="info-value">${this.clientData?.name || 'N/A'}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Company:</span>
                                <span class="info-value">${this.clientData?.company || 'N/A'}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Email:</span>
                                <span class="info-value">${this.clientData?.email || 'N/A'}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Phone:</span>
                                <span class="info-value">${this.clientData?.phone || 'N/A'}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Login Info -->
                    <div class="profile-card">
                        <h2><i class="fas fa-key"></i> Login Information</h2>
                        <div class="profile-info">
                            <div class="info-row">
                                <span class="info-label">Username:</span>
                                <span class="info-value">${authData.username}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Last Login:</span>
                                <span class="info-value">${authData.lastLogin ? new Date(authData.lastLogin).toLocaleString() : 'N/A'}</span>
                            </div>
                        </div>
                        <button class="btn-secondary" onclick="window.clientPortal.changePassword()">
                            <i class="fas fa-lock"></i> Change Password
                        </button>
                    </div>

                    <!-- Help & Support -->
                    <div class="profile-card">
                        <h2><i class="fas fa-life-ring"></i> Help & Support</h2>
                        <p>Need assistance? We're here to help!</p>
                        <div class="support-actions">
                            <button class="btn-secondary" onclick="window.clientPortal.switchView('messages')">
                                <i class="fas fa-envelope"></i> Send Message
                            </button>
                            <a href="mailto:support@auctus.com" class="btn-secondary">
                                <i class="fas fa-at"></i> Email Support
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderProjectCard(project) {
        return `
            <div class="project-card">
                <div class="project-card-header">
                    <h3>${project.name}</h3>
                    <span class="status-badge status-${project.status.toLowerCase().replace(' ', '-')}">
                        ${project.status}
                    </span>
                </div>
                ${project.description ? `<p class="project-description">${project.description.substring(0, 100)}${project.description.length > 100 ? '...' : ''}</p>` : ''}
                <div class="project-card-footer">
                    <span><i class="fas fa-calendar"></i> ${new Date(project.start_date).toLocaleDateString()}</span>
                    ${project.end_date ? `<span><i class="fas fa-flag-checkered"></i> ${new Date(project.end_date).toLocaleDateString()}</span>` : ''}
                </div>
            </div>
        `;
    }

    renderDetailedProjectCard(project) {
        const progress = this.calculateProjectProgress(project);
        
        return `
            <div class="detailed-project-card">
                <div class="project-card-header">
                    <h3>${project.name}</h3>
                    <span class="status-badge status-${project.status.toLowerCase().replace(' ', '-')}">
                        ${project.status}
                    </span>
                </div>
                
                ${project.description ? `
                    <p class="project-description">${project.description}</p>
                ` : ''}

                <div class="project-progress">
                    <div class="progress-header">
                        <span>Progress</span>
                        <span>${progress}%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                </div>

                <div class="project-meta-grid">
                    <div class="meta-item">
                        <i class="fas fa-calendar-alt"></i>
                        <div>
                            <small>Start Date</small>
                            <strong>${new Date(project.start_date).toLocaleDateString()}</strong>
                        </div>
                    </div>
                    ${project.end_date ? `
                        <div class="meta-item">
                            <i class="fas fa-flag-checkered"></i>
                            <div>
                                <small>Target Date</small>
                                <strong>${new Date(project.end_date).toLocaleDateString()}</strong>
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    renderUpdateItem(update) {
        return `
            <div class="update-item-compact">
                <div class="update-icon">
                    <i class="fas fa-bullhorn"></i>
                </div>
                <div class="update-content">
                    <h4>${update.title}</h4>
                    <p>${update.content.substring(0, 120)}${update.content.length > 120 ? '...' : ''}</p>
                    <div class="update-meta">
                        <span><i class="fas fa-user"></i> ${update.created_by}</span>
                        <span><i class="fas fa-clock"></i> ${new Date(update.created_at).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>
        `;
    }

    calculateProjectProgress(project) {
        // Simple progress calculation based on status
        const statusProgress = {
            'Planning': 20,
            'In Progress': 50,
            'Testing': 80,
            'Completed': 100,
            'On Hold': 25
        };
        return statusProgress[project.status] || 0;
    }

    async sendMessage(clientId) {
        const subject = document.getElementById('message-subject').value;
        const message = document.getElementById('message-content').value;

        if (!message.trim()) {
            alert('Please enter a message');
            return;
        }

        try {
            const authData = JSON.parse(localStorage.getItem('auctus_auth'));
            const response = await fetch('/.netlify/functions/client-messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    client_id: clientId,
                    subject: subject || 'No Subject',
                    message: message,
                    created_by: authData.username || this.clientData?.name || 'Client'
                })
            });

            if (response.ok) {
                document.getElementById('message-subject').value = '';
                document.getElementById('message-content').value = '';
                
                // Show success message
                this.showToast('Message sent successfully!', 'success');
                
                // Refresh messages view
                setTimeout(() => {
                    this.renderView('messages');
                }, 1000);
            } else {
                throw new Error('Failed to send message');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            this.showToast('Failed to send message. Please try again.', 'error');
        }
    }

    changePassword() {
        const modalHtml = `
            <div class="modal-overlay" onclick="if(event.target === this) this.remove()">
                <div class="modal" style="max-width: 500px;">
                    <div class="modal-header">
                        <h3><i class="fas fa-lock"></i> Change Password</h3>
                        <button class="close-btn" onclick="this.closest('.modal-overlay').remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <form id="change-password-form" class="modal-body">
                        <div class="form-group">
                            <label>Current Password</label>
                            <input type="password" class="form-input" id="current-password" required>
                        </div>
                        <div class="form-group">
                            <label>New Password</label>
                            <input type="password" class="form-input" id="new-password" required>
                        </div>
                        <div class="form-group">
                            <label>Confirm New Password</label>
                            <input type="password" class="form-input" id="confirm-password" required>
                        </div>
                        <div class="modal-actions">
                            <button type="button" class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">
                                Cancel
                            </button>
                            <button type="submit" class="btn-primary">
                                <i class="fas fa-check"></i> Update Password
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        document.getElementById('change-password-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;

            if (newPassword !== confirmPassword) {
                this.showToast('Passwords do not match', 'error');
                return;
            }

            // Here you would implement the actual password change logic
            this.showToast('Password change functionality coming soon!', 'info');
            document.querySelector('.modal-overlay').remove();
        });
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    showError(message) {
        const container = document.getElementById('client-portal-content');
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error</h3>
                <p>${message}</p>
                <button class="btn-primary" onclick="window.clientPortal.initialize()">
                    <i class="fas fa-redo"></i> Try Again
                </button>
            </div>
        `;
    }
}

// Initialize on load
window.clientPortal = new ClientPortalManager();
