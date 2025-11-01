// Client Portal Manager
class ClientPortalManager {
    constructor() {
        this.currentView = 'dashboard';
        this.clientData = null;
        this.debug = false;
        this.portalLayoutDefaults = null;
        this.activeResizeHandler = null;
        this.messagesPollInterval = null;
        this.isMessagesPolling = false;
    }

    // Helper method for authenticated fetch requests
    async authenticatedFetch(url, options = {}) {
        const token = localStorage.getItem('auctus_token');
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(url, {
            ...options,
            headers
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response.json();
    }

    escapeHTML(value) {
        if (value === null || value === undefined) {
            return '';
        }
        return String(value).replace(/[&<>'"]/g, (char) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        })[char] || char);
    }

    logDebug(...args) {
        if (!this.debug) {
            return;
        }
        console.log(...args);
    }

    cachePortalLayoutDefaults() {
        const portalContent = document.getElementById('client-portal-content');
        if (!portalContent || this.portalLayoutDefaults) {
            return;
        }

        this.portalLayoutDefaults = {
            padding: portalContent.style.padding,
            paddingTop: portalContent.style.paddingTop,
            paddingBottom: portalContent.style.paddingBottom,
            paddingLeft: portalContent.style.paddingLeft,
            paddingRight: portalContent.style.paddingRight,
            overflow: portalContent.style.overflow,
            overflowY: portalContent.style.overflowY,
            display: portalContent.style.display,
            flexDirection: portalContent.style.flexDirection
        };
    }

    restorePortalLayout() {
        const portalContent = document.getElementById('client-portal-content');
        if (!portalContent || !this.portalLayoutDefaults) {
            return;
        }

        Object.assign(portalContent.style, {
            padding: this.portalLayoutDefaults.padding,
            paddingTop: this.portalLayoutDefaults.paddingTop,
            paddingBottom: this.portalLayoutDefaults.paddingBottom,
            paddingLeft: this.portalLayoutDefaults.paddingLeft,
            paddingRight: this.portalLayoutDefaults.paddingRight,
            overflow: this.portalLayoutDefaults.overflow,
            overflowY: this.portalLayoutDefaults.overflowY,
            display: this.portalLayoutDefaults.display,
            flexDirection: this.portalLayoutDefaults.flexDirection
        });
    }

    resetViewLayout(container) {
        if (this.activeResizeHandler) {
            window.removeEventListener('resize', this.activeResizeHandler);
            this.activeResizeHandler = null;
        }

        this.restorePortalLayout();
        this.stopMessagesPolling();

        if (container) {
            container.removeAttribute('style');
        }
    }

    applyMessagesLayout(container) {
        const portalContent = document.getElementById('client-portal-content');
        this.cachePortalLayoutDefaults();

        if (portalContent) {
            portalContent.style.paddingTop = 'calc(70px + 0.5rem)';
            portalContent.style.paddingLeft = '1rem';
            portalContent.style.paddingRight = '1rem';
            portalContent.style.paddingBottom = '0';
            portalContent.style.overflow = 'hidden';
            portalContent.style.overflowY = 'hidden';
            portalContent.style.display = 'flex';
            portalContent.style.flexDirection = 'column';
        }

        if (container) {
            container.style.display = 'flex';
            container.style.flexDirection = 'column';
            container.style.padding = '0';
            container.style.margin = '0';
            container.style.gap = '0';
            container.style.height = '100%';
            container.style.flex = '1';
            container.style.minHeight = '0';
            container.style.overflow = 'hidden';
        }
    }

    adjustMessagesViewport(messagesRoot) {
        if (!messagesRoot) {
            return;
        }

        const portalContent = document.getElementById('client-portal-content');
        if (!portalContent) {
            return;
        }

        const nav = document.querySelector('#client-portal-container .client-portal-nav');
        const navHeight = nav ? nav.offsetHeight : 0;
        const contentRect = portalContent.getBoundingClientRect();
        const availableHeight = window.innerHeight - contentRect.top - navHeight;

        if (availableHeight > 0) {
            messagesRoot.style.height = `${availableHeight}px`;
            messagesRoot.style.maxHeight = `${availableHeight}px`;
        }
    }

    stopMessagesPolling() {
        if (this.messagesPollInterval) {
            clearInterval(this.messagesPollInterval);
            this.messagesPollInterval = null;
        }
        this.isMessagesPolling = false;
    }

    startMessagesPolling(handler, interval = 5000) {
        this.stopMessagesPolling();
        if (typeof handler !== 'function') {
            return;
        }
        this.messagesPollInterval = setInterval(async () => {
            if (this.isMessagesPolling) {
                return;
            }
            this.isMessagesPolling = true;
            try {
                await handler();
            } catch (error) {
                this.logDebug('messagesPoll error:', error);
            } finally {
                this.isMessagesPolling = false;
            }
        }, interval);
    }

    determineMessageAuthor(message, authData) {
        const createdBy = (message?.created_by || '').trim().toLowerCase();
        const clientName = (authData?.clientName || this.clientData?.name || '').trim().toLowerCase();

        if (createdBy && clientName && createdBy === clientName) {
            return 'client';
        }

        const adminIndicators = ['admin', 'auctus', 'team', 'support'];
        if (createdBy && adminIndicators.some(indicator => createdBy.includes(indicator))) {
            return 'admin';
        }

        // Default to admin when author cannot be matched to the client explicitly.
        return 'admin';
    }

    async initialize() {
        const authData = JSON.parse(localStorage.getItem('auctus_auth'));
        if (!authData || !authData.clientId) {
            this.showError('Please log in again');
            return;
        }

        try {
            // Use client data from auth data (already have it from login)
            this.clientData = {
                id: authData.clientId,
                name: authData.clientName || 'Client',
                company: authData.company || 'N/A'
            };
            
            this.logDebug('Client portal initializing with data:', this.clientData);
            this.renderNavigation();
            await this.renderView(this.currentView);
        } catch (error) {
            console.error('Error initializing client portal:', error);
            this.showError('Failed to load portal data');
        }
    }

    renderNavigation() {
        const container = document.getElementById('client-portal-container');
        this.logDebug('renderNavigation - Container found:', !!container);
        if (!container) {
            console.error('client-portal-container not found!');
            return;
        }

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

        const existingNav = container.querySelector('.client-portal-nav');
        if (existingNav) {
            existingNav.remove();
        }
        this.logDebug('Inserting navigation HTML at bottom');
        container.insertAdjacentHTML('beforeend', navHtml);
    }

    // Small loading skeleton helper used by several views
    loadingSkeleton(count = 3) {
        let html = '<div class="loading-skeletons">';
        for (let i = 0; i < count; i++) {
            html += `
                <div class="skeleton-card">
                    <div class="skeleton-line title"></div>
                    <div class="skeleton-line"></div>
                    <div class="skeleton-line short"></div>
                </div>
            `;
        }
        html += '</div>';
        return html;
    }

    switchView(view) {
        this.currentView = view;
        this.renderNavigation();
        this.renderView(view);
    }

    async renderView(view) {
        this.logDebug('renderView called with view:', view);
        const contentArea = document.getElementById('client-portal-main-content') || this.createMainContentArea();
        this.resetViewLayout(contentArea);
        this.logDebug('Content area element:', !!contentArea);
        
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
        this.logDebug('createMainContentArea - container:', !!container);
        const mainContent = document.createElement('div');
        mainContent.id = 'client-portal-main-content';
        mainContent.className = 'client-portal-main-content';
        container.appendChild(mainContent);
        this.logDebug('Created main content area, appended to container');
        return mainContent;
    }

    async renderDashboard(container) {
        // show loading skeleton immediately
        container.innerHTML = this.loadingSkeleton(4);

        const authData = JSON.parse(localStorage.getItem('auctus_auth'));
        const clientId2 = authData?.clientId;
        if (!clientId2) {
            container.innerHTML = '<div class="error-message">Error: Client ID not found. Please log in again.</div>';
            return;
        }

        try {
            // fetch updates and messages concurrently
            const [updates, messages] = await Promise.all([
                this.authenticatedFetch(`/.netlify/functions/client-updates?client_id=${clientId2}`).catch(() => []),
                this.authenticatedFetch(`/.netlify/functions/client-messages?client_id=${clientId2}`).catch(() => [])
            ]);

            const safeUpdates = Array.isArray(updates) ? updates : [];
            const safeMessages = Array.isArray(messages) ? messages : [];
            const recentUpdates = safeUpdates.slice(0, 3);

            // now render the dashboard with fetched data
            const clientProjects = [];
            const activeProjects = [];

            container.innerHTML = `
                <div class="client-dashboard">
                    <div class="dashboard-header">
                        <h1><i class="fas fa-home"></i> Welcome back, ${this.clientData?.name || 'Client'}!</h1>
                        <p class="dashboard-subtitle">Here's what's happening with your projects</p>
                    </div>

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
                                <div class="stat-value">${safeUpdates.length}</div>
                                <div class="stat-label">Recent Updates</div>
                            </div>
                        </div>
                        <div class="client-stat-card">
                            <div class="stat-icon" style="background: rgba(33, 150, 243, 0.2);">
                                <i class="fas fa-comments" style="color: #2196F3;"></i>
                            </div>
                            <div class="stat-details">
                                <div class="stat-value">${safeMessages.length}</div>
                                <div class="stat-label">Messages</div>
                            </div>
                        </div>
                    </div>

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

                    <div class="dashboard-section">
                        <div class="section-header">
                            <h2><i class="fas fa-bolt"></i> Quick Actions</h2>
                        </div>
                        <div class="quick-actions-grid">
                            <button class="quick-action-btn" onclick="window.clientPortal.switchView('projects')">
                                <i class="fas fa-project-diagram"></i>
                                <span>View Projects</span>
                            </button>
                            <button class="quick-action-btn" onclick="window.clientPortal.switchView('messages')">
                                <i class="fas fa-comments"></i>
                                <span>View Messages</span>
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
        // show skeleton while loading
        container.innerHTML = this.loadingSkeleton(3);

        container.innerHTML = `
            <div class="client-projects-view">
                <div class="view-header">
                    <h1><i class="fas fa-project-diagram"></i> My Projects</h1>
                    <p class="view-subtitle">View all your projects and their progress</p>
                </div>
                <div class="empty-state">
                    <i class="fas fa-project-diagram"></i>
                    <h3>Projects Coming Soon</h3>
                    <p>Your project list will appear here</p>
                </div>
            </div>
        `;
    }

    async renderUpdates(container) {
        // show skeleton while loading
        container.innerHTML = this.loadingSkeleton(3);

        const authData = JSON.parse(localStorage.getItem('auctus_auth'));
        const clientId = authData?.clientId;
        
        if (!clientId) {
            container.innerHTML = '<div class="error-message">Error: Client ID not found. Please log in again.</div>';
            return;
        }

        try {
            const updates = await this.authenticatedFetch(`/.netlify/functions/client-updates?client_id=${clientId}`).catch(() => []);
            const safeUpdates = Array.isArray(updates) ? updates : [];

            container.innerHTML = `
                <div class="client-updates-view">
                    <div class="view-header">
                        <h1><i class="fas fa-bullhorn"></i> Updates from Auctus</h1>
                        <p class="view-subtitle">Stay informed about your projects</p>
                    </div>

                    ${safeUpdates.length > 0 ? `
                        <div class="updates-timeline">
                            ${safeUpdates.map(update => this.renderTimelineItem(update)).join('')}
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
        // show skeleton while loading
        container.innerHTML = this.loadingSkeleton(3);

        const authData = JSON.parse(localStorage.getItem('auctus_auth'));
        const clientId = authData?.clientId;

        this.logDebug('[renderMessages] Client ID:', clientId);
        
        if (!clientId) {
            container.innerHTML = '<div class="error-message">Error: Client ID not found. Please log in again.</div>';
            return;
        }

        try {
            const fetchMessages = async () => {
                this.logDebug('[renderMessages] Fetching messages for client:', clientId);
                const response = await this.authenticatedFetch(`/.netlify/functions/client-messages?client_id=${clientId}`).catch(() => []);
                const payload = Array.isArray(response) ? response : [];
                this.logDebug('[renderMessages] Safe messages count:', payload.length);
                return payload;
            };

            const initialMessages = await fetchMessages();
            const sortMessages = (list) => [...list].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            const computeSignature = (list) => list.map(msg => `${msg.id ?? ''}|${msg.created_at}|${msg.created_by}|${msg.message || msg.subject || ''}`).join('::');
            let currentMessages = sortMessages(initialMessages);
            let currentSignature = computeSignature(currentMessages);

            // Clear container and set it to not scroll
            container.innerHTML = '';
            this.applyMessagesLayout(container);

            // Create messages view container that fits the screen
            const messagesView = document.createElement('div');
            messagesView.style.cssText = 'display: flex; flex-direction: column; flex: 1; min-height: 0; overflow: hidden; border-radius: 18px; background: var(--bg-primary); box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04);';

            // Header
            const header = document.createElement('div');
            header.style.cssText = 'padding: 1rem 1.5rem; border-bottom: 1px solid var(--border-color); flex-shrink: 0; background: var(--bg-secondary);';
            header.innerHTML = `
                <h3 style="margin: 0; font-size: 1.3rem; color: var(--text-primary);">Messages</h3>
                <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.25rem;">Chat with the Auctus team</div>
            `;
            messagesView.appendChild(header);

            // Messages feed
            const messagesFeed = document.createElement('div');
            messagesFeed.id = 'client-messages-feed';
            messagesFeed.style.cssText = 'flex: 1; overflow-y: auto; overflow-x: hidden; padding: 1rem 1.5rem; background: var(--bg-primary); display: flex; flex-direction: column; gap: 0.25rem; min-height: 0;';

            const renderMessagesFeed = (messagesList, { autoScroll = true } = {}) => {
                const previousScrollOffset = messagesFeed.scrollHeight - messagesFeed.scrollTop;
                messagesFeed.innerHTML = '';

                if (messagesList.length === 0) {
                    const emptyMsg = document.createElement('div');
                    emptyMsg.style.cssText = 'text-align: center; padding: 3rem 2rem; color: var(--text-secondary);';
                    emptyMsg.innerHTML = '<i class="fas fa-comments" style="font-size: 3rem; opacity: 0.3; margin-bottom: 1rem; display: block;"></i><p style="margin: 0;">No messages yet. Start the conversation below!</p>';
                    messagesFeed.appendChild(emptyMsg);
                } else {
                    const sorted = sortMessages(messagesList);
                    sorted.forEach((msg, index) => {
                        const authorType = this.determineMessageAuthor(msg, authData);
                        const isClient = authorType === 'client';
                        const previous = sorted[index - 1];
                        const showTimestamp = !previous || (new Date(msg.created_at).getTime() - new Date(previous.created_at).getTime() > 3600000);

                        if (showTimestamp) {
                            const timestampDiv = document.createElement('div');
                            timestampDiv.style.cssText = 'text-align: center; margin: 1rem 0 0.5rem; color: var(--text-secondary); font-size: 0.75rem;';
                            const date = new Date(msg.created_at);
                            const today = new Date();
                            const yesterday = new Date(today);
                            yesterday.setDate(yesterday.getDate() - 1);

                            let dateLabel;
                            if (date.toDateString() === today.toDateString()) {
                                dateLabel = 'Today';
                            } else if (date.toDateString() === yesterday.toDateString()) {
                                dateLabel = 'Yesterday';
                            } else {
                                dateLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                            }
                            timestampDiv.textContent = dateLabel;
                            messagesFeed.appendChild(timestampDiv);
                        }

                        const msgRow = document.createElement('div');
                        msgRow.style.cssText = `display: flex; align-items: flex-end; gap: 0.5rem; margin-bottom: 0.25rem; ${isClient ? 'flex-direction: row-reverse;' : 'flex-direction: row;'}`;

                        const bubble = document.createElement('div');
                        bubble.style.cssText = `
                            max-width: 65%;
                            padding: 0.65rem 1rem;
                            border-radius: 18px;
                            background: ${isClient ? '#007AFF' : '#E5E5EA'};
                            color: ${isClient ? 'white' : '#000000'};
                            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
                            word-wrap: break-word;
                            position: relative;
                        `;

                        const tail = document.createElement('div');
                        tail.style.cssText = `
                            position: absolute;
                            bottom: 0;
                            width: 0;
                            height: 0;
                            border-style: solid;
                            ${isClient ? 
                                'right: -6px; border-width: 0 0 10px 8px; border-color: transparent transparent transparent #007AFF;' : 
                                'left: -6px; border-width: 0 8px 10px 0; border-color: transparent #E5E5EA transparent transparent;'}
                        `;
                        bubble.appendChild(tail);

                        const content = document.createElement('div');
                        content.style.cssText = 'line-height: 1.4; font-size: 0.95rem;';
                        content.textContent = msg.message || msg.content;
                        bubble.appendChild(content);

                        msgRow.appendChild(bubble);

                        const time = document.createElement('div');
                        time.style.cssText = 'font-size: 0.7rem; color: var(--text-secondary); padding-bottom: 0.25rem; white-space: nowrap;';
                        const msgDate = new Date(msg.created_at);
                        time.textContent = msgDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                        msgRow.appendChild(time);

                        messagesFeed.appendChild(msgRow);
                    });
                }

                requestAnimationFrame(() => {
                    if (autoScroll) {
                        messagesFeed.scrollTop = messagesFeed.scrollHeight;
                    } else {
                        const target = Math.max(messagesFeed.scrollHeight - previousScrollOffset, 0);
                        messagesFeed.scrollTop = target;
                    }
                });
            };

            const isNearBottom = () => {
                const distance = messagesFeed.scrollHeight - messagesFeed.clientHeight - messagesFeed.scrollTop;
                return distance < 80;
            };

            renderMessagesFeed(currentMessages, { autoScroll: true });

            messagesView.appendChild(messagesFeed);

            // Compose form
            const composeSection = document.createElement('div');
            composeSection.style.cssText = 'flex-shrink: 0; border-top: 1px solid var(--border-color); padding: 0.75rem 1.5rem 1rem; background: var(--bg-secondary);';

            const composeForm = document.createElement('form');
            composeForm.id = 'client-message-form';
            composeForm.style.cssText = 'display: flex; gap: 0.75rem; align-items: flex-end;';

            const messageInput = document.createElement('textarea');
            messageInput.id = 'message-content';
            messageInput.rows = 1;
            messageInput.placeholder = 'Type a message...';
            messageInput.required = true;
            messageInput.style.cssText = 'flex: 1; padding: 0.75rem 1rem; border: 1px solid var(--border-color); border-radius: 20px; background: var(--bg-primary); color: var(--text-primary); font-size: 0.95rem; resize: none; max-height: 100px; font-family: inherit;';

            // Auto-resize
            messageInput.addEventListener('input', function() {
                this.style.height = 'auto';
                this.style.height = Math.min(this.scrollHeight, 100) + 'px';
            });

            // Send on Enter
            messageInput.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    composeForm.dispatchEvent(new Event('submit'));
                }
            });

            const sendBtn = document.createElement('button');
            sendBtn.type = 'submit';
            sendBtn.className = 'btn-primary';
            sendBtn.style.cssText = 'padding: 0.75rem 1rem; background: var(--primary-color); color: white; border: none; border-radius: 50%; cursor: pointer; font-weight: 600; transition: all 0.2s; display: flex; align-items: center; justify-content: center; width: 40px; height: 40px;';
            sendBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';

            sendBtn.addEventListener('mouseenter', () => {
                sendBtn.style.transform = 'scale(1.05)';
                sendBtn.style.boxShadow = '0 4px 12px rgba(33, 150, 243, 0.3)';
            });
            sendBtn.addEventListener('mouseleave', () => {
                sendBtn.style.transform = 'scale(1)';
                sendBtn.style.boxShadow = 'none';
            });

            composeForm.appendChild(messageInput);
            composeForm.appendChild(sendBtn);
            composeSection.appendChild(composeForm);
            messagesView.appendChild(composeSection);

            // Add to container
            container.appendChild(messagesView);

            const adjustLayout = () => this.adjustMessagesViewport(messagesView);
            adjustLayout();
            requestAnimationFrame(adjustLayout);
            this.activeResizeHandler = adjustLayout;
            window.addEventListener('resize', adjustLayout, { passive: true });

            const reloadMessages = async ({ forceScroll = false } = {}) => {
                try {
                    const latest = await fetchMessages();
                    const sortedLatest = sortMessages(latest);
                    const nextSignature = computeSignature(sortedLatest);
                    if (!forceScroll && nextSignature === currentSignature) {
                        return;
                    }
                    currentMessages = sortedLatest;
                    currentSignature = nextSignature;
                    const autoScroll = forceScroll || isNearBottom();
                    renderMessagesFeed(currentMessages, { autoScroll });
                } catch (error) {
                    this.logDebug('[renderMessages] reload error:', error);
                }
            };

            // Setup message form submit
            composeForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const messageContent = messageInput.value.trim();
                if (!messageContent) return;
                // Clear and reset input
                messageInput.value = '';
                messageInput.style.height = 'auto';

                // Send to server
                await this.sendMessage(clientId, messageContent);
                await reloadMessages({ forceScroll: true });
            });

            this.startMessagesPolling(() => reloadMessages({ forceScroll: false }));
        } catch (error) {
            console.error('[renderMessages] Error:', error);
            container.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Failed to load messages</p>
                    <p style="font-size: 0.9em; opacity: 0.7;">${error.message}</p>
                </div>
            `;
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
        // show skeleton while loading
        container.innerHTML = this.loadingSkeleton(3);

        const authData = JSON.parse(localStorage.getItem('auctus_auth'));
        const clientId = authData?.clientId;
        
        if (!clientId) {
            container.innerHTML = '<div class="error-message">Error: Client ID not found. Please log in again.</div>';
            return;
        }

        try {
            // For now, show placeholder - invoices API for client portal would need to be created
            const clientInvoices = [];

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
                                <span class="info-value">${this.escapeHTML(this.clientData?.name || 'N/A')}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Company:</span>
                                <span class="info-value">${this.escapeHTML(this.clientData?.company || 'N/A')}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Email:</span>
                                <span class="info-value">${this.escapeHTML(this.clientData?.email || 'N/A')}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Phone:</span>
                                <span class="info-value">${this.escapeHTML(this.clientData?.phone || 'N/A')}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Login Info -->
                    <div class="profile-card">
                        <h2><i class="fas fa-key"></i> Login Information</h2>
                        <div class="profile-info">
                            <div class="info-row">
                                <span class="info-label">Username:</span>
                                <span class="info-value">${this.escapeHTML(authData.username)}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Last Login:</span>
                                <span class="info-value">${this.escapeHTML(authData.lastLogin ? new Date(authData.lastLogin).toLocaleString() : 'N/A')}</span>
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
        const name = this.escapeHTML(project?.name || 'Project');
        const statusLabel = project?.status || 'Status';
        const statusClass = (statusLabel.toLowerCase().replace(/[^a-z0-9-]+/g, '-') || 'unknown');
        const statusText = this.escapeHTML(statusLabel);
        const description = project?.description ? this.escapeHTML(project.description.substring(0, 100)) : '';
        const startDate = this.escapeHTML(new Date(project.start_date).toLocaleDateString());
        const endDate = project.end_date ? this.escapeHTML(new Date(project.end_date).toLocaleDateString()) : '';

        return `
            <div class="project-card">
                <div class="project-card-header">
                    <h3>${name}</h3>
                    <span class="status-badge status-${statusClass}">
                        ${statusText}
                    </span>
                </div>
                ${project.description ? `<p class="project-description">${description}${project.description.length > 100 ? '...' : ''}</p>` : ''}
                <div class="project-card-footer">
                    <span><i class="fas fa-calendar"></i> ${startDate}</span>
                    ${project.end_date ? `<span><i class="fas fa-flag-checkered"></i> ${endDate}</span>` : ''}
                </div>
            </div>
        `;
    }

    renderDetailedProjectCard(project) {
        const progress = this.calculateProjectProgress(project);
        const name = this.escapeHTML(project?.name || 'Project');
        const statusLabel = project?.status || 'Status';
        const statusClass = (statusLabel.toLowerCase().replace(/[^a-z0-9-]+/g, '-') || 'unknown');
        const statusText = this.escapeHTML(statusLabel);
        const description = project?.description ? this.escapeHTML(project.description) : '';
        const startDate = this.escapeHTML(new Date(project.start_date).toLocaleDateString());
        const endDate = project.end_date ? this.escapeHTML(new Date(project.end_date).toLocaleDateString()) : '';
        
        return `
            <div class="detailed-project-card">
                <div class="project-card-header">
                    <h3>${name}</h3>
                    <span class="status-badge status-${statusClass}">
                        ${statusText}
                    </span>
                </div>
                
                ${project.description ? `
                    <p class="project-description">${description}</p>
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
                            <strong>${startDate}</strong>
                        </div>
                    </div>
                    ${project.end_date ? `
                        <div class="meta-item">
                            <i class="fas fa-flag-checkered"></i>
                            <div>
                                <small>Target Date</small>
                                <strong>${endDate}</strong>
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    renderUpdateItem(update) {
        const title = this.escapeHTML(update?.title || 'Update');
        const content = update?.content || '';
        const summary = this.escapeHTML(content.substring(0, 120));
        const createdBy = this.escapeHTML(update?.created_by || 'Auctus');
        const createdAt = this.escapeHTML(new Date(update.created_at).toLocaleDateString());

        return `
            <div class="update-item-compact">
                <div class="update-icon">
                    <i class="fas fa-bullhorn"></i>
                </div>
                <div class="update-content">
                    <h4>${title}</h4>
                    <p>${summary}${content.length > 120 ? '...' : ''}</p>
                    <div class="update-meta">
                        <span><i class="fas fa-user"></i> ${createdBy}</span>
                        <span><i class="fas fa-clock"></i> ${createdAt}</span>
                    </div>
                </div>
            </div>
        `;
    }

    renderTimelineItem(update) {
        const title = this.escapeHTML(update?.title || 'Update');
        const createdAt = this.escapeHTML(new Date(update.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }));
        const content = this.escapeHTML(update?.content || '').replace(/\n/g, '<br>');
        const author = this.escapeHTML(update?.created_by || 'Auctus');

        return `
            <div class="timeline-item">
                <div class="timeline-marker">
                    <i class="fas fa-circle"></i>
                </div>
                <div class="timeline-content">
                    <div class="update-card">
                        <div class="update-header">
                            <h3>${title}</h3>
                            <span class="update-date">
                                <i class="fas fa-calendar"></i>
                                ${createdAt}
                            </span>
                        </div>
                        <div class="update-body">
                            <p>${content}</p>
                        </div>
                        <div class="update-footer">
                            <span class="update-author">
                                <i class="fas fa-user"></i> ${author}
                            </span>
                        </div>
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

    async sendMessage(clientId, messageContent, subject = null) {
        if (!messageContent || !messageContent.trim()) {
            return; // Already validated in form submit
        }

        try {
            const authData = JSON.parse(localStorage.getItem('auctus_auth'));
            const payload = {
                client_id: clientId,
                subject,
                message: messageContent,
                created_by: authData?.clientName || this.clientData?.name || 'Client'
            };
            
            this.logDebug('Sending message with payload:', payload);
            
            await this.authenticatedFetch('/.netlify/functions/client-messages', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            this.logDebug('Message sent successfully');
            this.showToast('Message sent!', 'success');
        } catch (error) {
            console.error('Error sending message:', error);
            this.showToast('Failed to send message. Please try again.', 'error');
            
            // Refresh on error to show actual state
            const viewContainer = document.getElementById('client-portal-content');
            if (viewContainer) {
                await this.renderMessages(viewContainer);
            }
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

        const icon = document.createElement('i');
        icon.className = `fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}`;

        const text = document.createElement('span');
        text.textContent = message;

        toast.appendChild(icon);
        toast.appendChild(text);

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
                <p>${this.escapeHTML(message)}</p>
                <button class="btn-primary" onclick="window.clientPortal.initialize()">
                    <i class="fas fa-redo"></i> Try Again
                </button>
            </div>
        `;
    }
}

// Initialize on load
window.clientPortal = new ClientPortalManager();
