// Modal Manager - Handles all modals
class ModalManager {
    constructor() {
        this.container = document.getElementById('modal-container');
    }

    async closeModal() {
        this.container.innerHTML = '';
        if (window.app) {
            await window.app.updateStats();
            await window.app.loadViewContent(window.app.currentView);
        }
    }

    async openClientModal(clientId = null) {
        const clients = await window.storageManager.getClients();
        const client = clientId ? clients.find(c => c.id == clientId) : null;
        const isEdit = !!client;

        this.container.innerHTML = `
            <div class="modal-overlay" onclick="if(event.target === this) window.modalManager.closeModal()">
                <div class="modal">
                    <div class="modal-header">
                        <h3>${isEdit ? 'Edit Client' : 'Add New Client'}</h3>
                        <button class="close-btn" onclick="window.modalManager.closeModal()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-content">
                        <form id="client-form">
                            <div class="form-group">
                                <label>Client Name *</label>
                                <input type="text" class="form-input" name="name" value="${client?.name || ''}" required>
                            </div>
                            <div class="form-group">
                                <label>Email</label>
                                <input type="email" class="form-input" name="email" value="${client?.email || ''}">
                            </div>
                            <div class="form-group">
                                <label>Phone</label>
                                <input type="tel" class="form-input" name="phone" value="${client?.phone || ''}">
                            </div>
                            <div class="form-group">
                                <label>Company</label>
                                <input type="text" class="form-input" name="company" value="${client?.company || ''}">
                            </div>
                            <div class="form-group">
                                <label>Client Type *</label>
                                <select class="form-select" name="type" required>
                                    <option value="current" ${client?.type === 'current' ? 'selected' : ''}>Current Client</option>
                                    <option value="potential" ${client?.type === 'potential' ? 'selected' : ''}>Potential Client</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Notes</label>
                                <textarea class="form-textarea" name="notes">${client?.notes || ''}</textarea>
                            </div>
                            ${isEdit ? `
                            <button type="button" class="btn-primary btn-danger" style="margin-bottom: 1rem;" onclick="window.modalManager.deleteClient('${clientId}')">
                                <i class="fas fa-trash"></i> Delete Client
                            </button>
                            ` : ''}
                            <button type="submit" class="btn-primary">
                                ${isEdit ? 'Update Client' : 'Add Client'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('client-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData);
            
            if (isEdit) {
                await window.storageManager.updateClient(clientId, data);
            } else {
                await window.storageManager.addClient(data);
            }
            await this.closeModal();
            await window.app.loadViewContent('clients');
            await window.app.updateStats();
        });
    }

    async openProjectModal(projectId = null) {
        const projects = await window.storageManager.getProjects();
        const project = projectId ? projects.find(p => p.id === projectId) : null;
        const clients = await window.storageManager.getClients();
        const isEdit = !!project;

        this.container.innerHTML = `
            <div class="modal-overlay" onclick="if(event.target === this) window.modalManager.closeModal()">
                <div class="modal">
                    <div class="modal-header">
                        <h3>${isEdit ? 'Edit Project' : 'New Project'}</h3>
                        <button class="close-btn" onclick="window.modalManager.closeModal()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-content">
                        <form id="project-form">
                            <div class="form-group">
                                <label>Project Name *</label>
                                <input type="text" class="form-input" name="name" value="${project?.name || ''}" required>
                            </div>
                            <div class="form-group">
                                <label>Client</label>
                                <select class="form-select" name="clientId">
                                    <option value="">Select a client</option>
                                    ${clients.map(c => `
                                        <option value="${c.id}" ${project?.clientId === c.id ? 'selected' : ''}>${c.name}</option>
                                    `).join('')}
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Status *</label>
                                <select class="form-select" name="status" required>
                                    <option value="active" ${project?.status === 'active' ? 'selected' : ''}>Active</option>
                                    <option value="paused" ${project?.status === 'paused' ? 'selected' : ''}>Paused</option>
                                    <option value="completed" ${project?.status === 'completed' ? 'selected' : ''}>Completed</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Progress (%)</label>
                                <input type="number" class="form-input" name="progress" min="0" max="100" value="${project?.progress || 0}">
                            </div>
                            <div class="form-group">
                                <label>Start Date</label>
                                <input type="date" class="form-input" name="startDate" value="${project?.startDate || ''}">
                            </div>
                            <div class="form-group">
                                <label>Description</label>
                                <textarea class="form-textarea" name="description">${project?.description || ''}</textarea>
                            </div>
                            ${isEdit ? `
                            <button type="button" class="btn-primary btn-danger" style="margin-bottom: 1rem;" onclick="window.modalManager.deleteProject('${projectId}')">
                                <i class="fas fa-trash"></i> Delete Project
                            </button>
                            ` : ''}
                            <button type="submit" class="btn-primary">
                                ${isEdit ? 'Update Project' : 'Create Project'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('project-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData);
            
            if (isEdit) {
                await window.storageManager.updateProject(projectId, data);
            } else {
                await window.storageManager.addProject(data);
            }
            await this.closeModal();
        });
    }

    async openWebsiteModal(websiteId = null) {
        const websites = await window.storageManager.getWebsites();
        const website = websiteId ? websites.find(w => w.id == websiteId) : null;
        const isEdit = !!website;

        this.container.innerHTML = `
            <div class="modal-overlay" onclick="if(event.target === this) window.modalManager.closeModal()">
                <div class="modal">
                    <div class="modal-header">
                        <h3>${isEdit ? 'Edit Website' : 'Add Website'}</h3>
                        <button class="close-btn" onclick="window.modalManager.closeModal()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-content">
                        <form id="website-form">
                            <div class="form-group">
                                <label>Website Name *</label>
                                <input type="text" class="form-input" name="name" value="${website?.name || ''}" required>
                            </div>
                            <div class="form-group">
                                <label>URL</label>
                                <input type="url" class="form-input" name="url" placeholder="https://example.com" value="${website?.url || ''}">
                            </div>
                            <div class="form-group">
                                <label>Status *</label>
                                <select class="form-select" name="status" required>
                                    <option value="live" ${website?.status === 'live' ? 'selected' : ''}>Live</option>
                                    <option value="development" ${website?.status === 'development' ? 'selected' : ''}>Development</option>
                                    <option value="maintenance" ${website?.status === 'maintenance' ? 'selected' : ''}>Maintenance</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Description</label>
                                <textarea class="form-textarea" name="description">${website?.description || ''}</textarea>
                            </div>
                            <div class="form-group">
                                <label>Technologies Used</label>
                                <input type="text" class="form-input" name="technologies" placeholder="e.g., React, Node.js, MongoDB" value="${website?.technologies || ''}">
                            </div>
                            ${isEdit ? `
                            <button type="button" class="btn-primary btn-danger" style="margin-bottom: 1rem;" onclick="window.modalManager.deleteWebsite('${websiteId}')">
                                <i class="fas fa-trash"></i> Delete Website
                            </button>
                            ` : ''}
                            <button type="submit" class="btn-primary">
                                ${isEdit ? 'Update Website' : 'Add Website'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('website-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData);
            
            if (isEdit) {
                await window.storageManager.updateWebsite(websiteId, data);
            } else {
                await window.storageManager.addWebsite(data);
            }
            await this.closeModal();
        });
    }

    async openIdeaModal(ideaId = null) {
        const ideas = await window.storageManager.getIdeas();
        const idea = ideaId ? ideas.find(i => i.id == ideaId) : null;
        const isEdit = !!idea;

        this.container.innerHTML = `
            <div class="modal-overlay" onclick="if(event.target === this) window.modalManager.closeModal()">
                <div class="modal">
                    <div class="modal-header">
                        <h3>${isEdit ? 'Edit Idea' : 'New Idea'}</h3>
                        <button class="close-btn" onclick="window.modalManager.closeModal()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-content">
                        <form id="idea-form">
                            <div class="form-group">
                                <label>Title *</label>
                                <input type="text" class="form-input" name="title" value="${idea?.title || ''}" required>
                            </div>
                            <div class="form-group">
                                <label>Category</label>
                                <select class="form-select" name="category">
                                    <option value="">Select category</option>
                                    <option value="feature" ${idea?.category === 'feature' ? 'selected' : ''}>Feature Idea</option>
                                    <option value="project" ${idea?.category === 'project' ? 'selected' : ''}>New Project</option>
                                    <option value="improvement" ${idea?.category === 'improvement' ? 'selected' : ''}>Improvement</option>
                                    <option value="client" ${idea?.category === 'client' ? 'selected' : ''}>Client Related</option>
                                    <option value="other" ${idea?.category === 'other' ? 'selected' : ''}>Other</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Priority</label>
                                <select class="form-select" name="priority">
                                    <option value="low" ${idea?.priority === 'low' ? 'selected' : ''}>Low</option>
                                    <option value="medium" ${idea?.priority === 'medium' ? 'selected' : ''}>Medium</option>
                                    <option value="high" ${idea?.priority === 'high' ? 'selected' : ''}>High</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Content *</label>
                                <textarea class="form-textarea" name="content" style="min-height: 150px;" required>${idea?.content || ''}</textarea>
                            </div>
                            ${isEdit ? `
                            <button type="button" class="btn-primary btn-danger" style="margin-bottom: 1rem;" onclick="window.modalManager.deleteIdea('${ideaId}')">
                                <i class="fas fa-trash"></i> Delete Idea
                            </button>
                            ` : ''}
                            <button type="submit" class="btn-primary">
                                ${isEdit ? 'Update Idea' : 'Save Idea'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('idea-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData);
            
            if (isEdit) {
                await window.storageManager.updateIdea(ideaId, data);
            } else {
                await window.storageManager.addIdea(data);
            }
            await this.closeModal();
        });
    }

    async openFinanceModal(financeId = null, defaultType = 'income') {
        const finances = await window.storageManager.getFinances();
        const clients = await window.storageManager.getClients();
        const projects = await window.storageManager.getProjects();
        const finance = financeId ? finances.find(f => f.id == financeId) : null;
        const isEdit = !!finance;
        
        const today = new Date().toISOString().split('T')[0];

        this.container.innerHTML = `
            <div class="modal-overlay" onclick="if(event.target === this) window.modalManager.closeModal()">
                <div class="modal">
                    <div class="modal-header">
                        <h3>${isEdit ? 'Edit Transaction' : 'Add Transaction'}</h3>
                        <button class="close-btn" onclick="window.modalManager.closeModal()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-content">
                        <form id="finance-form">
                            <div class="form-group">
                                <label>Type *</label>
                                <select class="form-select" name="type" required>
                                    <option value="income" ${(finance?.type === 'income' || (!isEdit && defaultType === 'income')) ? 'selected' : ''}>Income</option>
                                    <option value="expense" ${(finance?.type === 'expense' || (!isEdit && defaultType === 'expense')) ? 'selected' : ''}>Expense</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Category *</label>
                                <input type="text" class="form-input" name="category" value="${finance?.category || ''}" placeholder="e.g., Website Design, Office Supplies" required>
                            </div>
                            <div class="form-group">
                                <label>Amount *</label>
                                <input type="number" class="form-input" name="amount" value="${finance?.amount || ''}" step="0.01" min="0" placeholder="0.00" required>
                            </div>
                            <div class="form-group">
                                <label>Description</label>
                                <textarea class="form-textarea" name="description" rows="3" placeholder="Optional notes about this transaction">${finance?.description || ''}</textarea>
                            </div>
                            <div class="form-group">
                                <label>Client (Optional)</label>
                                <select class="form-select" name="client_id">
                                    <option value="">None</option>
                                    ${clients.map(c => `<option value="${c.id}" ${finance?.client_id == c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Project (Optional)</label>
                                <select class="form-select" name="project_id">
                                    <option value="">None</option>
                                    ${projects.map(p => `<option value="${p.id}" ${finance?.project_id == p.id ? 'selected' : ''}>${p.name}</option>`).join('')}
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Transaction Date *</label>
                                <input type="date" class="form-input" name="transaction_date" value="${finance?.transaction_date || today}" required>
                            </div>
                            <div class="form-group">
                                <label>Payment Method</label>
                                <select class="form-select" name="payment_method">
                                    <option value="">Select method</option>
                                    <option value="cash" ${finance?.payment_method === 'cash' ? 'selected' : ''}>Cash</option>
                                    <option value="check" ${finance?.payment_method === 'check' ? 'selected' : ''}>Check</option>
                                    <option value="card" ${finance?.payment_method === 'card' ? 'selected' : ''}>Credit/Debit Card</option>
                                    <option value="transfer" ${finance?.payment_method === 'transfer' ? 'selected' : ''}>Bank Transfer</option>
                                    <option value="paypal" ${finance?.payment_method === 'paypal' ? 'selected' : ''}>PayPal</option>
                                    <option value="other" ${finance?.payment_method === 'other' ? 'selected' : ''}>Other</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Status *</label>
                                <select class="form-select" name="status" required>
                                    <option value="completed" ${finance?.status === 'completed' || !isEdit ? 'selected' : ''}>Completed</option>
                                    <option value="pending" ${finance?.status === 'pending' ? 'selected' : ''}>Pending</option>
                                </select>
                            </div>
                            <div class="form-actions">
                                ${isEdit ? `<button type="button" class="btn btn-danger" onclick="window.modalManager.deleteFinance('${finance.id}')">Delete</button>` : ''}
                                <button type="submit" class="btn btn-primary">${isEdit ? 'Update' : 'Add'} Transaction</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('finance-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const financeData = {
                type: formData.get('type'),
                category: formData.get('category'),
                amount: parseFloat(formData.get('amount')),
                description: formData.get('description'),
                client_id: formData.get('client_id') || null,
                project_id: formData.get('project_id') || null,
                transaction_date: formData.get('transaction_date'),
                payment_method: formData.get('payment_method') || null,
                status: formData.get('status')
            };

            if (isEdit) {
                await window.storageManager.updateFinance(finance.id, financeData);
            } else {
                await window.storageManager.addFinance(financeData);
            }
            await this.closeModal();
        });
    }

    async deleteClient(id) {
        if (confirm('Are you sure you want to delete this client?')) {
            await window.storageManager.deleteClient(id);
            await this.closeModal();
        }
    }

    async deleteProject(id) {
        if (confirm('Are you sure you want to delete this project?')) {
            await window.storageManager.deleteProject(id);
            await this.closeModal();
        }
    }

    async deleteWebsite(id) {
        if (confirm('Are you sure you want to delete this website?')) {
            await window.storageManager.deleteWebsite(id);
            await this.closeModal();
        }
    }

    async deleteIdea(id) {
        if (confirm('Are you sure you want to delete this idea?')) {
            await window.storageManager.deleteIdea(id);
            await this.closeModal();
        }
    }

    async deleteFinance(id) {
        if (confirm('Are you sure you want to delete this transaction?')) {
            await window.storageManager.deleteFinance(id);
            await this.closeModal();
        }
    }
}

// Initialize modal manager
window.modalManager = new ModalManager();
