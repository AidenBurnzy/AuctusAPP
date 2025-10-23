// Client Account Manager
class ClientAccountManager {
    async openCreateAccountModal() {
        const clients = await window.storageManager.getClients();
        
        // Get clients that don't have portal access yet
        const portalUsersResponse = await fetch('/.netlify/functions/client-portal-users');
        const portalUsers = await portalUsersResponse.json();
        const clientsWithAccess = portalUsers.map(u => u.client_id);
        const availableClients = clients.filter(c => !clientsWithAccess.includes(c.id));
        
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
                                    ${availableClients.map(c => `
                                        <option value="${c.id}">${c.name}${c.company ? ` - ${c.company}` : ''}</option>
                                    `).join('')}
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
                    alert(error.error || 'Failed to create account');
                }
            } catch (error) {
                console.error('Error creating account:', error);
                alert('Failed to create account');
            }
        });
    }
    
    async editAccount(userId) {
        const response = await fetch('/.netlify/functions/client-portal-users');
        const users = await response.json();
        const user = users.find(u => u.id === userId);
        
        if (!user) {
            alert('User not found');
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
                    alert('Failed to update account');
                }
            } catch (error) {
                console.error('Error updating account:', error);
                alert('Failed to update account');
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
                alert('Failed to delete account');
            }
        } catch (error) {
            console.error('Error deleting account:', error);
            alert('Failed to delete account');
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
                        created_by: currentUser
                    })
                });
                
                if (response.ok) {
                    document.querySelector('.modal-overlay').remove();
                    window.app.showNotification('Update posted successfully!');
                } else {
                    alert('Failed to post update');
                }
            } catch (error) {
                console.error('Error posting update:', error);
                alert('Failed to post update');
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
    
    async viewMessage(messageId) {
        try {
            const response = await fetch('/.netlify/functions/client-messages');
            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }
            
            const messages = await response.json();
            if (!Array.isArray(messages)) {
                alert('Invalid response from server');
                return;
            }
            
            const message = messages.find(m => m.id === messageId);
            
            if (!message) {
                alert('Message not found');
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
            alert('Failed to load message');
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
                alert('Failed to archive message');
            }
        } catch (error) {
            console.error('Error archiving message:', error);
            alert('Failed to archive message');
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
                alert('Failed to delete message');
            }
        } catch (error) {
            console.error('Error deleting message:', error);
            alert('Failed to delete message');
        }
    }
}

// Initialize client account manager
window.clientAccountManager = new ClientAccountManager();
