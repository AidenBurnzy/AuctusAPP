// View Manager - Renders different views
class ViewManager {
    async renderClientsView() {
        console.log('Rendering clients view...');
        let clients = await window.storageManager.getClients();
        console.log('Clients fetched:', clients, 'Type:', typeof clients, 'Is Array:', Array.isArray(clients));
        
        // Safety check: ensure clients is always an array
        if (!Array.isArray(clients)) {
            console.error('Clients is not an array!', clients);
            clients = [];
        }
        
        const container = document.getElementById('clients-view');
        
        container.innerHTML = `
            <div class="view-header">
                <h2>Clients</h2>
                <button class="add-btn" onclick="window.modalManager.openClientModal()">
                    <i class="fas fa-plus"></i> Add Client
                </button>
            </div>
            ${clients.length === 0 ? this.renderEmptyState('users', 'No clients yet', 'Add your first client to get started') : ''}
            <div class="list-container">
                ${clients.map(client => this.renderClientCard(client)).join('')}
            </div>
        `;
    }

    renderClientCard(client) {
        return `
            <div class="list-item" onclick="window.modalManager.openClientModal('${client.id}')">
                <div class="item-header">
                    <div>
                        <div class="item-title">${client.name}</div>
                        <div class="item-subtitle">${client.email || 'No email'}</div>
                    </div>
                    <span class="item-status ${client.type === 'current' ? 'status-active' : 'status-potential'}">
                        ${client.type}
                    </span>
                </div>
                ${client.phone ? `
                <div class="item-meta">
                    <span><i class="fas fa-phone"></i> ${client.phone}</span>
                </div>
                ` : ''}
                ${client.notes ? `
                <div class="item-meta">
                    <span><i class="fas fa-sticky-note"></i> ${client.notes.substring(0, 50)}${client.notes.length > 50 ? '...' : ''}</span>
                </div>
                ` : ''}
            </div>
        `;
    }

    async renderProjectsView() {
        let projects = await window.storageManager.getProjects();
        let clients = await window.storageManager.getClients();
        
        // Safety checks
        if (!Array.isArray(projects)) {
            console.error('Projects is not an array!', projects);
            projects = [];
        }
        if (!Array.isArray(clients)) {
            console.error('Clients is not an array!', clients);
            clients = [];
        }
        
        const container = document.getElementById('projects-view');
        
        container.innerHTML = `
            <div class="view-header">
                <h2>Projects</h2>
                <button class="add-btn" onclick="window.modalManager.openProjectModal()">
                    <i class="fas fa-plus"></i> New Project
                </button>
            </div>
            ${projects.length === 0 ? this.renderEmptyState('project-diagram', 'No projects yet', 'Create your first project') : ''}
            <div class="list-container">
                ${projects.map(project => this.renderProjectCard(project, clients)).join('')}
            </div>
        `;
    }

    renderProjectCard(project, clients) {
        const client = clients.find(c => c.id === project.clientId);
        const statusClass = {
            'active': 'status-active',
            'completed': 'status-completed',
            'paused': 'status-paused'
        }[project.status] || 'status-potential';

        return `
            <div class="list-item" onclick="window.modalManager.openProjectModal('${project.id}')">
                <div class="item-header">
                    <div>
                        <div class="item-title">${project.name}</div>
                        <div class="item-subtitle">${client ? client.name : 'No client assigned'}</div>
                    </div>
                    <span class="item-status ${statusClass}">
                        ${project.status}
                    </span>
                </div>
                ${project.description ? `
                <div class="item-meta" style="margin-top: 0.75rem">
                    <span>${project.description.substring(0, 100)}${project.description.length > 100 ? '...' : ''}</span>
                </div>
                ` : ''}
                <div class="item-meta">
                    ${project.startDate ? `<span><i class="fas fa-calendar"></i> ${new Date(project.startDate).toLocaleDateString()}</span>` : ''}
                    ${project.progress ? `<span><i class="fas fa-tasks"></i> ${project.progress}% complete</span>` : ''}
                </div>
            </div>
        `;
    }

    async renderWebsitesView() {
        let websites = await window.storageManager.getWebsites();
        
        // Safety check
        if (!Array.isArray(websites)) {
            console.error('Websites is not an array!', websites);
            websites = [];
        }
        
        const container = document.getElementById('websites-view');
        
        container.innerHTML = `
            <div class="view-header">
                <h2>Websites</h2>
                <button class="add-btn" onclick="window.modalManager.openWebsiteModal()">
                    <i class="fas fa-plus"></i> Add Website
                </button>
            </div>
            ${websites.length === 0 ? this.renderEmptyState('globe', 'No websites yet', 'Add your first website') : ''}
            <div class="list-container">
                ${websites.map(website => this.renderWebsiteCard(website)).join('')}
            </div>
        `;
    }

    renderWebsiteCard(website) {
        return `
            <div class="list-item" onclick="window.modalManager.openWebsiteModal('${website.id}')">
                <div class="item-header">
                    <div>
                        <div class="item-title">${website.name}</div>
                        <div class="item-subtitle">${website.url || 'No URL'}</div>
                    </div>
                    <span class="item-status ${website.status === 'live' ? 'status-active' : 'status-potential'}">
                        ${website.status || 'development'}
                    </span>
                </div>
                ${website.description ? `
                <div class="item-meta" style="margin-top: 0.75rem">
                    <span>${website.description}</span>
                </div>
                ` : ''}
                ${website.url ? `
                <div class="item-meta">
                    <span>
                        <a href="${website.url}" target="_blank" onclick="event.stopPropagation()" style="color: var(--primary-color);">
                            <i class="fas fa-external-link-alt"></i> Visit Website
                        </a>
                    </span>
                </div>
                ` : ''}
            </div>
        `;
    }

    async renderIdeasView() {
        let ideas = await window.storageManager.getIdeas();
        
        // Safety check
        if (!Array.isArray(ideas)) {
            console.error('Ideas is not an array!', ideas);
            ideas = [];
        }
        
        const container = document.getElementById('ideas-view');
        
        container.innerHTML = `
            <div class="view-header">
                <h2>Ideas & Notes</h2>
                <button class="add-btn" onclick="window.modalManager.openIdeaModal()">
                    <i class="fas fa-plus"></i> New Idea
                </button>
            </div>
            ${ideas.length === 0 ? this.renderEmptyState('lightbulb', 'No ideas yet', 'Capture your first idea') : ''}
            <div class="list-container">
                ${ideas.map(idea => this.renderIdeaCard(idea)).join('')}
            </div>
        `;
    }

    renderIdeaCard(idea) {
        const priorityClass = {
            'high': 'status-active',
            'medium': 'status-potential',
            'low': 'status-paused'
        }[idea.priority] || 'status-potential';

        return `
            <div class="list-item" onclick="window.modalManager.openIdeaModal('${idea.id}')">
                <div class="item-header">
                    <div>
                        <div class="item-title">${idea.title}</div>
                        <div class="item-subtitle">${new Date(idea.createdAt).toLocaleDateString()}</div>
                    </div>
                    ${idea.priority ? `<span class="item-status ${priorityClass}">${idea.priority}</span>` : ''}
                </div>
                ${idea.content ? `
                <div class="item-meta" style="margin-top: 0.75rem">
                    <span>${idea.content.substring(0, 150)}${idea.content.length > 150 ? '...' : ''}</span>
                </div>
                ` : ''}
                ${idea.category ? `
                <div class="item-meta">
                    <span><i class="fas fa-tag"></i> ${idea.category}</span>
                </div>
                ` : ''}
            </div>
        `;
    }

    async renderFinancesView() {
        console.log('Rendering finances view...');
        let finances = await window.storageManager.getFinances();
        console.log('Finances fetched:', finances, 'Type:', typeof finances, 'Is Array:', Array.isArray(finances));
        
        // Safety check: ensure finances is always an array
        if (!Array.isArray(finances)) {
            console.error('Finances is not an array!', finances);
            finances = [];
        }
        
        // Calculate totals
        const totals = finances.reduce((acc, f) => {
            const amount = parseFloat(f.amount) || 0;
            if (f.type === 'income') {
                acc.income += amount;
            } else if (f.type === 'expense') {
                acc.expense += amount;
            }
            return acc;
        }, { income: 0, expense: 0 });
        
        const balance = totals.income - totals.expense;
        
        const container = document.getElementById('finances-view');
        
        container.innerHTML = `
            <div class="view-header">
                <h2>Finances</h2>
                <div class="finance-actions">
                    <button class="add-btn" onclick="window.modalManager.openFinanceModal(null, 'income')" style="background: #4CAF50;">
                        <i class="fas fa-arrow-up"></i> Add Income
                    </button>
                    <button class="add-btn" onclick="window.modalManager.openFinanceModal(null, 'expense')" style="background: #f44336;">
                        <i class="fas fa-arrow-down"></i> Add Expense
                    </button>
                </div>
            </div>
            
            <div class="finance-summary">
                <div class="summary-card" style="border-left: 4px solid #4CAF50;">
                    <div class="summary-label">Total Income</div>
                    <div class="summary-amount" style="color: #4CAF50;">$${totals.income.toFixed(2)}</div>
                </div>
                <div class="summary-card" style="border-left: 4px solid #f44336;">
                    <div class="summary-label">Total Expenses</div>
                    <div class="summary-amount" style="color: #f44336;">$${totals.expense.toFixed(2)}</div>
                </div>
                <div class="summary-card" style="border-left: 4px solid ${balance >= 0 ? '#4CAF50' : '#f44336'};">
                    <div class="summary-label">Balance</div>
                    <div class="summary-amount" style="color: ${balance >= 0 ? '#4CAF50' : '#f44336'};">${balance >= 0 ? '+' : ''}$${balance.toFixed(2)}</div>
                </div>
            </div>
            
            ${finances.length === 0 ? this.renderEmptyState('dollar-sign', 'No transactions yet', 'Track your first income or expense') : ''}
            <div class="list-container">
                ${finances.map(finance => this.renderFinanceCard(finance)).join('')}
            </div>
        `;
    }

    renderFinanceCard(finance) {
        const amount = parseFloat(finance.amount) || 0;
        const isIncome = finance.type === 'income';
        const date = finance.transaction_date ? new Date(finance.transaction_date).toLocaleDateString() : 'No date';
        
        return `
            <div class="list-item" onclick="window.modalManager.openFinanceModal('${finance.id}')">
                <div class="item-header">
                    <div>
                        <div class="item-title">
                            <i class="fas fa-arrow-${isIncome ? 'up' : 'down'}" style="color: ${isIncome ? '#4CAF50' : '#f44336'};"></i>
                            ${finance.category}
                        </div>
                        <div class="item-subtitle">${finance.description || 'No description'}</div>
                    </div>
                    <div class="finance-amount" style="color: ${isIncome ? '#4CAF50' : '#f44336'};">
                        ${isIncome ? '+' : '-'}$${amount.toFixed(2)}
                    </div>
                </div>
                <div class="item-meta">
                    <span><i class="fas fa-calendar"></i> ${date}</span>
                    ${finance.payment_method ? `<span><i class="fas fa-credit-card"></i> ${finance.payment_method}</span>` : ''}
                    ${finance.status ? `<span class="item-status ${finance.status === 'completed' ? 'status-completed' : 'status-pending'}">${finance.status}</span>` : ''}
                </div>
            </div>
        `;
    }

    renderEmptyState(icon, title, description) {
        return `
            <div class="empty-state">
                <i class="fas fa-${icon}"></i>
                <h3>${title}</h3>
                <p>${description}</p>
            </div>
        `;
    }
}

// Initialize view manager
window.viewManager = new ViewManager();
