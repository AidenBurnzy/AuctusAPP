// Client Account Manager
class ClientAccountManager {
    constructor() {
        this.debug = false;
        this.pendingClientViewRefresh = false;
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

    determineMessageOrigin(message, clientIdentifiers = [], adminIdentifiers = []) {
        const createdBy = (message?.created_by || '').trim().toLowerCase();
        if (!createdBy) {
            return 'admin';
        }

        const normalizedIdentifiers = clientIdentifiers
            .map(identifier => (identifier || '').trim().toLowerCase())
            .filter(Boolean);

        const normalizedAdminIdentifiers = adminIdentifiers
            .map(identifier => (identifier || '').trim().toLowerCase())
            .filter(Boolean);

        if (normalizedAdminIdentifiers.some(identifier => createdBy === identifier || createdBy.includes(identifier))) {
            return 'admin';
        }

        if (normalizedIdentifiers.some(identifier => createdBy === identifier || createdBy.includes(identifier))) {
            return 'client';
        }

        const adminIndicators = ['admin', 'auctus', 'team', 'support'];
        if (adminIndicators.some(indicator => createdBy.includes(indicator))) {
            return 'admin';
        }

        return 'admin';
    }

    queueClientViewRefresh() {
        this.pendingClientViewRefresh = true;
    }

    async flushClientViewRefresh() {
        if (!this.pendingClientViewRefresh) {
            return;
        }

        this.pendingClientViewRefresh = false;
        if (window.viewManager && typeof window.viewManager.renderClientAccountsView === 'function') {
            await window.viewManager.renderClientAccountsView();
        }
    }

    notify(message, type = 'info') {
        if (window.app && typeof window.app.showNotification === 'function') {
            window.app.showNotification(message, type);
        }
    }
    async openCreateAccountModal() {
        const clients = await window.storageManager.getClients();
        
        // Get clients that don't have portal access yet
        const portalUsersResponse = await fetch('/.netlify/functions/client-portal-users');
        const portalUsers = await portalUsersResponse.json();
        const clientsWithAccess = portalUsers.map(u => u.client_id);
        const availableClients = clients.filter(c => !clientsWithAccess.includes(c.id));
        
        const clientOptions = availableClients.map(client => {
            const id = this.escapeHTML(String(client.id ?? ''));
            const name = this.escapeHTML(client.name || 'Client');
            const company = client.company ? ` - ${this.escapeHTML(client.company)}` : '';
            return `<option value="${id}">${name}${company}</option>`;
        }).join('');

        const modalHtml = `
            <div class="modal-overlay" onclick="if(event.target === this) this.remove()">
                <div class="modal" style="max-width: 500px; border-radius: 20px; margin: auto;">
                    <div class="modal-header">
                        <h3><i class="fas fa-user-plus"></i> Create Client Portal Account</h3>
                        <button class="close-btn" onclick="this.closest('.modal-overlay').remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-content">
                        <form id="create-client-account-form">
                            <div class="form-group">
                                <label>Select Client *</label>
                                <select class="form-select" name="client_id" required>
                                    <option value="">Choose a client...</option>
                                    ${clientOptions}
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Username *</label>
                                <input type="text" class="form-input" name="username" placeholder="e.g., johndoe" required>
                                <small style="color: var(--text-secondary);">Client will use this to login</small>
                            </div>
                            <div class="form-group">
                                <label>Password *</label>
                                <input type="text" class="form-input" name="password" placeholder="Create a secure password" required>
                                <small style="color: var(--text-secondary);">Share this with the client securely</small>
                            </div>
                            <div class="form-actions">
                                <button type="button" class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                                <button type="submit" class="btn-primary">
                                    <i class="fas fa-check"></i> Create Account
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        document.getElementById('create-client-account-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            
            try {
                const response = await fetch('/.netlify/functions/client-portal-users', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        client_id: formData.get('client_id'),
                        username: formData.get('username'),
                        password: formData.get('password')
                    })
                });
                
                if (response.ok) {
                    document.querySelector('.modal-overlay').remove();
                    await window.viewManager.renderClientAccountsView();
                    window.app.showNotification('Client account created successfully!');
                } else {
                    const error = await response.json();
                    this.notify(error.error || 'Failed to create account', 'error');
                }
            } catch (error) {
                console.error('Error creating account:', error);
                this.notify('Failed to create account', 'error');
            }
        });
    }
    
    async editAccount(userId) {
        const response = await fetch('/.netlify/functions/client-portal-users');
        const users = await response.json();
        const user = users.find(u => u.id === userId);
        
        if (!user) {
            this.notify('User not found', 'error');
            return;
        }
        
        const modalHtml = `
            <div class="modal-overlay" onclick="if(event.target === this) this.remove()">
                <div class="modal" style="max-width: 500px; border-radius: 20px; margin: auto;">
                    <div class="modal-header">
                        <h3><i class="fas fa-edit"></i> Edit Account</h3>
                        <button class="close-btn" onclick="this.closest('.modal-overlay').remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-content">
                        <form id="edit-client-account-form">
                            <div class="form-group">
                                <label>Client</label>
                                <input type="text" class="form-input" value="${user.client_name}" disabled>
                            </div>
                            <div class="form-group">
                                <label>Username *</label>
                                <input type="text" class="form-input" name="username" value="${user.username}" required>
                            </div>
                            <div class="form-group">
                                <label>New Password (leave blank to keep current)</label>
                                <input type="text" class="form-input" name="password" placeholder="Enter new password">
                            </div>
                            <div class="form-actions">
                                <button type="button" class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                                <button type="submit" class="btn-primary">
                                    <i class="fas fa-save"></i> Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        document.getElementById('edit-client-account-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            
            const updateData = {
                id: userId,
                username: formData.get('username'),
                password: formData.get('password') || user.password
            };
            
            try {
                const response = await fetch('/.netlify/functions/client-portal-users', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updateData)
                });
                
                if (response.ok) {
                    document.querySelector('.modal-overlay').remove();
                    await window.viewManager.renderClientAccountsView();
                    window.app.showNotification('Account updated successfully!');
                } else {
                    this.notify('Failed to update account', 'error');
                }
            } catch (error) {
                console.error('Error updating account:', error);
                this.notify('Failed to update account', 'error');
            }
        });
    }
    
    async deleteAccount(userId) {
        if (!confirm('Are you sure you want to delete this client portal account? The client will no longer be able to login.')) {
            return;
        }
        
        try {
            const response = await fetch(`/.netlify/functions/client-portal-users?id=${userId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                await window.viewManager.renderClientAccountsView();
                window.app.showNotification('Account deleted successfully');
            } else {
                this.notify('Failed to delete account', 'error');
            }
        } catch (error) {
            console.error('Error deleting account:', error);
            this.notify('Failed to delete account', 'error');
        }
    }
    
    async postUpdate(clientId) {
        const clients = await window.storageManager.getClients();
        const client = clients.find(c => c.id === clientId);
        
        const modalHtml = `
            <div class="modal-overlay" onclick="if(event.target === this) this.remove()">
                <div class="modal" style="max-width: 600px; border-radius: 20px; margin: auto;">
                    <div class="modal-header">
                        <h3><i class="fas fa-bullhorn"></i> Post Update for ${client?.name || 'Client'}</h3>
                        <button class="close-btn" onclick="this.closest('.modal-overlay').remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-content">
                        <form id="post-update-form">
                            <div class="form-group">
                                <label>Title *</label>
                                <input type="text" class="form-input" name="title" placeholder="Update title" required>
                            </div>
                            <div class="form-group">
                                <label>Message *</label>
                                <textarea class="form-textarea" name="content" rows="6" placeholder="Update details..." required></textarea>
                            </div>
                            <div class="form-actions">
                                <button type="button" class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                                <button type="submit" class="btn-primary">
                                    <i class="fas fa-paper-plane"></i> Post Update
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        document.getElementById('post-update-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const currentUser = localStorage.getItem('auctus_current_user') || 'Auctus';
            
            try {
                const response = await fetch('/.netlify/functions/client-updates', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        client_id: clientId,
                        title: formData.get('title'),
                        content: formData.get('content'),
                        posted_by: currentUser
                    })
                });
                
                if (response.ok) {
                    document.querySelector('.modal-overlay').remove();
                    window.app.showNotification('Update posted successfully!');
                } else {
                    const errorText = await response.text();
                    console.error('Failed to post update:', errorText);
                    this.notify('Failed to post update', 'error');
                }
            } catch (error) {
                console.error('Error posting update:', error);
                this.notify('Failed to post update', 'error');
            }
        });
    }

    async sendMessageToClient(clientId, clientName) {
        const modalHtml = `
            <div class="modal-overlay" onclick="if(event.target === this) this.remove()">
                <div class="modal" style="max-width: 600px; border-radius: 20px; margin: auto;">
                    <div class="modal-header">
                        <h3><i class="fas fa-envelope"></i> Send Message to ${clientName || 'Client'}</h3>
                        <button class="close-btn" onclick="this.closest('.modal-overlay').remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-content">
                        <form id="send-message-form">
                            <div class="form-group">
                                <label>Subject (Optional)</label>
                                <input type="text" class="form-input" name="subject" placeholder="Message subject">
                            </div>
                            <div class="form-group">
                                <label>Message *</label>
                                <textarea class="form-textarea" name="message" rows="6" placeholder="Type your message..." required></textarea>
                            </div>
                            <div class="form-actions">
                                <button type="button" class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                                <button type="submit" class="btn-primary">
                                    <i class="fas fa-paper-plane"></i> Send Message
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        document.getElementById('send-message-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const currentUser = localStorage.getItem('auctus_current_user') || 'Auctus Admin';
            
            try {
                const payload = {
                    client_id: clientId,
                    subject: formData.get('subject') || 'No Subject',
                    message: formData.get('message'),
                    created_by: currentUser
                };
                
                this.logDebug('Sending admin message:', payload);
                
                const response = await fetch('/.netlify/functions/client-messages', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                
                if (response.ok) {
                    document.querySelector('.modal-overlay').remove();
                    window.app.showNotification('Message sent successfully!');
                    // Refresh the view to show the message
                    await window.viewManager.renderClientAccountsView();
                } else {
                    const errorText = await response.text();
                    console.error('Error response:', errorText);
                    this.notify('Failed to send message', 'error');
                }
            } catch (error) {
                console.error('Error sending message:', error);
                this.notify(`Failed to send message: ${error.message}`, 'error');
            }
        });
    }
    
    async viewClientDetails(clientId) {
        const clients = await window.storageManager.getClients();
        const client = clients.find(c => c.id === clientId);
        
        const projectsResponse = await fetch('/.netlify/functions/projects');
        const allProjects = await projectsResponse.json();
        const clientProjects = allProjects.filter(p => p.client_id === clientId);
        
        const updatesResponse = await fetch(`/.netlify/functions/client-updates?client_id=${clientId}`);
        const updates = await updatesResponse.json();
        
        const modalHtml = `
            <div class="modal-overlay" onclick="if(event.target === this) this.remove()">
                <div class="modal" style="max-width: 800px; border-radius: 20px; margin: auto; max-height: 90vh; overflow-y: auto;">
                    <div class="modal-header">
                        <h3><i class="fas fa-user-circle"></i> ${client?.name || 'Client Details'}</h3>
                        <button class="close-btn" onclick="this.closest('.modal-overlay').remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-content">
                        <div class="settings-grid">
                            <div class="settings-card">
                                <div class="settings-card-header">
                                    <i class="fas fa-info-circle"></i>
                                    <h3>Client Info</h3>
                                </div>
                                <div class="settings-card-body">
                                    <div class="settings-item">
                                        <div class="settings-label">Name</div>
                                        <div class="settings-value">${client?.name || 'N/A'}</div>
                                    </div>
                                    ${client?.company ? `
                                        <div class="settings-item">
                                            <div class="settings-label">Company</div>
                                            <div class="settings-value">${client.company}</div>
                                        </div>
                                    ` : ''}
                                    ${client?.email ? `
                                        <div class="settings-item">
                                            <div class="settings-label">Email</div>
                                            <div class="settings-value">${client.email}</div>
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                            
                            <div class="settings-card">
                                <div class="settings-card-header">
                                    <i class="fas fa-project-diagram"></i>
                                    <h3>Projects (${clientProjects.length})</h3>
                                </div>
                                <div class="settings-card-body">
                                    ${clientProjects.length > 0 ? `
                                        <div class="data-list">
                                            ${clientProjects.map(p => `
                                                <div class="data-item">
                                                    <div class="data-content">
                                                        <h4>${p.name}</h4>
                                                        <div class="data-meta">
                                                            <span class="status-badge status-${p.status}">${p.status}</span>
                                                            <span><i class="fas fa-calendar"></i> ${new Date(p.start_date).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            `).join('')}
                                        </div>
                                    ` : '<p style="color: var(--text-secondary);">No projects yet</p>'}
                                </div>
                            </div>
                            
                            <div class="settings-card">
                                <div class="settings-card-header">
                                    <i class="fas fa-bullhorn"></i>
                                    <h3>Updates (${updates.length})</h3>
                                </div>
                                <div class="settings-card-body">
                                    ${updates.length > 0 ? `
                                        <div class="updates-list">
                                            ${updates.slice(0, 5).map(u => `
                                                <div class="update-item" style="margin-bottom: 1rem;">
                                                    <div class="update-header">
                                                        <h4>${u.title}</h4>
                                                        <span class="update-date">${new Date(u.created_at).toLocaleDateString()}</span>
                                                    </div>
                                                    <p style="font-size: 0.875rem;">${u.content}</p>
                                                </div>
                                            `).join('')}
                                        </div>
                                    ` : '<p style="color: var(--text-secondary);">No updates posted yet</p>'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }
    
    async openMessageThread(clientId, businessNameHint = 'Client', contactNameHint = '') {
        try {
            const safeClientId = String(clientId);
            const [messagesRes, clients] = await Promise.all([
                fetch('/.netlify/functions/client-messages'),
                window.storageManager ? window.storageManager.getClients() : Promise.resolve([])
            ]);

            if (!messagesRes.ok) {
                throw new Error(`Failed to load messages (${messagesRes.status})`);
            }

            let allMessages = await messagesRes.json();
            if (!Array.isArray(allMessages)) {
                allMessages = [];
            }

            const clientMessages = allMessages
                .filter(msg => String(msg.client_id) === safeClientId && !msg.is_archived)
                .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

            const clientRecord = Array.isArray(clients)
                ? clients.find(c => String(c.id) === safeClientId)
                : null;

            const companySource = clientRecord?.company || businessNameHint || 'Client';
            const businessNameRaw = typeof companySource === 'string' ? companySource.trim() : String(companySource);
            const contactSource = clientRecord?.name || contactNameHint || '';
            const contactNameRaw = contactSource ? (typeof contactSource === 'string' ? contactSource.trim() : String(contactSource)) : '';
            const contactEmailRaw = clientRecord?.email || '';
            const businessName = this.escapeHTML(businessNameRaw || 'Client');
            const contactName = this.escapeHTML(contactNameRaw);
            const contactEmail = this.escapeHTML(contactEmailRaw);

            const unreadMessages = clientMessages.filter(msg => !msg.is_read);
            if (unreadMessages.length > 0) {
                await Promise.all(unreadMessages.map(msg =>
                    fetch('/.netlify/functions/client-messages', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: msg.id, is_read: true })
                    })
                ));

                clientMessages.forEach(msg => {
                    msg.is_read = true;
                });
            }

            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay message-thread-overlay';
            overlay.innerHTML = `
                <div class="modal thread-modal" style="max-width: 720px; border-radius: 20px; margin: auto;">
                    <div class="modal-header">
                        <h3><i class="fas fa-comments"></i> Messages · ${businessName}</h3>
                        <button class="close-btn" data-thread-close>
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-content thread-modal-content">
                        <div class="thread-client-meta">
                            <span class="thread-client-label"><i class="fas fa-building"></i> ${businessName}</span>
                            ${contactName ? `<span class="thread-client-contact"><i class="fas fa-user"></i> ${contactName}</span>` : ''}
                            ${contactEmail ? `<span class="thread-client-contact"><i class="fas fa-envelope"></i> ${contactEmail}</span>` : ''}
                        </div>
                        <div class="thread-messages" id="thread-messages-container"></div>
                        <form id="thread-message-form" class="thread-compose">
                            <textarea id="thread-message-input" placeholder="Type a message..." rows="2" required></textarea>
                            <button type="submit" class="thread-send-btn" title="Send">
                                <i class="fas fa-paper-plane"></i>
                            </button>
                        </form>
                    </div>
                </div>
            `;

            const messagesContainer = overlay.querySelector('#thread-messages-container');
            const form = overlay.querySelector('#thread-message-form');
            const textarea = overlay.querySelector('#thread-message-input');

            const clientIdentifiers = [contactNameRaw, clientRecord?.name, businessNameRaw];
            const adminIdentifier = localStorage.getItem('auctus_current_user') || 'Auctus Admin';

            const renderThread = (messages = []) => {
                messagesContainer.innerHTML = '';

                if (messages.length === 0) {
                    const emptyState = document.createElement('div');
                    emptyState.className = 'empty-thread-state';
                    emptyState.innerHTML = `
                        <i class="fas fa-comments"></i>
                        <p>No messages yet. Start the conversation below.</p>
                    `;
                    messagesContainer.appendChild(emptyState);
                    return;
                }

                let lastDateLabel = '';
                messages.forEach(message => {
                    const createdAt = new Date(message.created_at);
                    const dateLabel = createdAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

                    if (dateLabel !== lastDateLabel) {
                        const divider = document.createElement('div');
                        divider.className = 'thread-day-divider';
                        divider.textContent = dateLabel;
                        messagesContainer.appendChild(divider);
                        lastDateLabel = dateLabel;
                    }

                    const authorType = this.determineMessageOrigin(message, clientIdentifiers, [adminIdentifier]);
                    const isAdmin = authorType === 'admin';
                    const messageRow = document.createElement('div');
                    messageRow.className = `thread-message ${isAdmin ? 'from-admin' : 'from-client'}`;

                    const bubble = document.createElement('div');
                    bubble.className = 'thread-bubble';

                    const textParagraph = document.createElement('p');
                    textParagraph.textContent = message.message || message.subject || '';
                    bubble.appendChild(textParagraph);

                    const meta = document.createElement('span');
                    meta.className = 'thread-bubble-meta';
                    meta.textContent = `${createdAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}${isAdmin ? ' · You' : ''}`;
                    bubble.appendChild(meta);

                    messageRow.appendChild(bubble);
                    messagesContainer.appendChild(messageRow);
                });

                requestAnimationFrame(() => {
                    messagesContainer.scrollTop = messagesContainer.scrollHeight;
                });
            };

            renderThread(clientMessages);

            const refreshThread = async ({ silent = false } = {}) => {
                const refreshRes = await fetch('/.netlify/functions/client-messages');
                if (!refreshRes.ok) {
                    throw new Error('Failed to refresh conversation');
                }

                let refreshedMessages = await refreshRes.json();
                if (!Array.isArray(refreshedMessages)) {
                    refreshedMessages = [];
                }

                const updatedMessages = refreshedMessages
                    .filter(msg => String(msg.client_id) === safeClientId && !msg.is_archived)
                    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

                const unread = updatedMessages.filter(msg => !msg.is_read);
                if (unread.length > 0) {
                    await Promise.all(unread.map(msg =>
                        fetch('/.netlify/functions/client-messages', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id: msg.id, is_read: true })
                        })
                    ));

                    updatedMessages.forEach(msg => {
                        msg.is_read = true;
                    });
                }

                renderThread(updatedMessages);
                if (!silent) {
                    this.queueClientViewRefresh();
                }

                return updatedMessages;
            };

            let pollHandle = null;
            let isPolling = false;

            const startPolling = () => {
                if (pollHandle) {
                    return;
                }

                pollHandle = setInterval(async () => {
                    if (isPolling) {
                        return;
                    }

                    isPolling = true;
                    try {
                        await refreshThread({ silent: true });
                    } catch (error) {
                        this.logDebug('Message thread poll error:', error);
                    } finally {
                        isPolling = false;
                    }
                }, 5000);
            };

            function stopPolling() {
                if (pollHandle) {
                    clearInterval(pollHandle);
                    pollHandle = null;
                }
                isPolling = false;
            }

            startPolling();

            const closeThread = () => {
                stopPolling();
                if (overlay.parentNode) {
                    overlay.remove();
                }
                document.removeEventListener('keydown', handleKeyDown, true);
                this.flushClientViewRefresh();
            };

            function handleKeyDown(event) {
                if (event.key === 'Escape') {
                    event.preventDefault();
                    closeThread();
                }
            }

            overlay.addEventListener('click', (event) => {
                if (event.target === overlay || event.target.closest('[data-thread-close]')) {
                    closeThread();
                }
            });

            document.addEventListener('keydown', handleKeyDown, true);
            document.body.appendChild(overlay);

            if (textarea) {
                textarea.addEventListener('input', () => {
                    textarea.style.height = 'auto';
                    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
                });

                textarea.addEventListener('keydown', (event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        form.dispatchEvent(new Event('submit', { cancelable: true }));
                    }
                });
            }

            form.addEventListener('submit', async (event) => {
                event.preventDefault();
                const content = textarea.value.trim();
                if (!content) {
                    return;
                }

                const currentUser = localStorage.getItem('auctus_current_user') || 'Auctus Admin';

                try {
                    const response = await fetch('/.netlify/functions/client-messages', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            client_id: clientId,
                            subject: 'Conversation',
                            message: content,
                            created_by: currentUser
                        })
                    });
                    if (!response.ok) {
                        throw new Error('Failed to send message');
                    }

                    textarea.value = '';
                    textarea.style.height = 'auto';
                    await refreshThread();
                    window.app.showNotification('Message sent!');
                } catch (error) {
                    console.error('Error sending message:', error);
                    this.notify('Failed to send message. Please try again.', 'error');
                }
            });

            this.queueClientViewRefresh();
        } catch (error) {
            console.error('Error opening message thread:', error);
            this.notify('Unable to open message thread. Please try again.', 'error');
        }
    }

    async viewMessage(messageId) {
        try {
            const response = await fetch('/.netlify/functions/client-messages');
            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }
            
            const messages = await response.json();
            if (!Array.isArray(messages)) {
                return;
            }
            
            const message = messages.find(m => m.id === messageId);
            
            if (!message) {
                this.notify('Message not found', 'error');
                return;
            }
        
            const modalHtml = `
                <div class="modal-overlay" onclick="if(event.target === this) this.remove()">
                    <div class="modal" style="max-width: 600px; border-radius: 20px; margin: auto;">
                        <div class="modal-header">
                            <h3><i class="fas fa-envelope-open"></i> ${message.subject || 'Message'}</h3>
                            <button class="close-btn" onclick="this.closest('.modal-overlay').remove()">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="modal-content">
                            <div class="data-meta" style="margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border-color);">
                                <span><i class="fas fa-user"></i> From: ${message.created_by}</span>
                                <span><i class="fas fa-clock"></i> ${new Date(message.created_at).toLocaleString()}</span>
                                ${message.is_read ? '<span style="color: var(--text-secondary);"><i class="fas fa-check-double"></i> Read</span>' : '<span style="color: var(--primary-color);"><i class="fas fa-envelope"></i> Unread</span>'}
                            </div>
                            <div style="line-height: 1.6; color: var(--text-primary);">
                                ${message.message}
                            </div>
                            <div class="form-actions" style="margin-top: 2rem;">
                                ${!message.is_read ? `
                                    <button class="btn-primary" onclick="window.clientAccountManager.markAsRead(${message.id})">
                                        <i class="fas fa-check"></i> Mark as Read
                                    </button>
                                ` : ''}
                                <button class="btn-warning" onclick="window.clientAccountManager.archiveMessage(${message.id})" style="background: rgba(255, 152, 0, 0.2); color: var(--warning-color); border: 1px solid var(--warning-color);">
                                    <i class="fas fa-archive"></i> Archive
                                </button>
                                <button class="btn-danger" onclick="if(confirm('Delete this message? This cannot be undone.')) window.clientAccountManager.deleteMessage(${message.id})" style="background: rgba(255, 107, 107, 0.2); color: var(--danger-color); border: 1px solid var(--danger-color);">
                                    <i class="fas fa-trash"></i> Delete
                                </button>
                                <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', modalHtml);
        } catch (error) {
            console.error('Error viewing message:', error);
            this.notify('Failed to load message', 'error');
        }
    }
    
    async markAsRead(messageId) {
        try {
            const response = await fetch('/.netlify/functions/client-messages', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: messageId,
                    is_read: true
                })
            });
            
            if (response.ok) {
                const modal = document.querySelector('.modal-overlay');
                if (modal) modal.remove();
                await window.viewManager.renderClientAccountsView();
                window.app.showNotification('Message marked as read');
            }
        } catch (error) {
            console.error('Error marking message as read:', error);
        }
    }

    async archiveMessage(messageId) {
        try {
            const response = await fetch('/.netlify/functions/client-messages', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: messageId,
                    is_read: true,
                    is_archived: true
                })
            });
            
            if (response.ok) {
                const modal = document.querySelector('.modal-overlay');
                if (modal) modal.remove();
                await window.viewManager.renderClientAccountsView();
                window.app.showNotification('Message archived');
            } else {
                this.notify('Failed to archive message', 'error');
            }
        } catch (error) {
            console.error('Error archiving message:', error);
            this.notify('Failed to archive message', 'error');
        }
    }

    async deleteMessage(messageId) {
        try {
            const response = await fetch('/.netlify/functions/client-messages', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: messageId })
            });
            
            if (response.ok) {
                const modal = document.querySelector('.modal-overlay');
                if (modal) modal.remove();
                await window.viewManager.renderClientAccountsView();
                window.app.showNotification('Message deleted successfully');
            } else {
                this.notify('Failed to delete message', 'error');
            }
        } catch (error) {
            console.error('Error deleting message:', error);
            this.notify('Failed to delete message', 'error');
        }
    }
}

// Initialize client account manager
window.clientAccountManager = new ClientAccountManager();
