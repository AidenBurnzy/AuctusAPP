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
        console.log('Rendering comprehensive finances view...');
        
        // Fetch all financial data
        let recurringIncome = await window.storageManager.getRecurringIncome();
        let subscriptions = await window.storageManager.getSubscriptions();
        let allocations = await window.storageManager.getAllocations();
        let employees = await window.storageManager.getEmployees();
        
        // Safety checks
        recurringIncome = Array.isArray(recurringIncome) ? recurringIncome.filter(i => i.is_active !== false) : [];
        subscriptions = Array.isArray(subscriptions) ? subscriptions.filter(s => s.is_active !== false) : [];
        allocations = Array.isArray(allocations) ? allocations : [];
        employees = Array.isArray(employees) ? employees.filter(e => e.is_active !== false) : [];
        
        // Calculate totals
        const grossIncome = recurringIncome.reduce((sum, i) => sum + (parseFloat(i.monthly_payment) || 0), 0);
        const subscriptionsCost = subscriptions.reduce((sum, s) => sum + (parseFloat(s.monthly_cost) || 0), 0);
        const netIncome = grossIncome - subscriptionsCost;
        
        // Calculate allocations
        const allocationAmounts = allocations.map(a => ({
            ...a,
            amount: (netIncome * (parseFloat(a.percentage) || 0)) / 100
        }));
        
        // Calculate employee income
        const employeePayroll = employees.map(e => ({
            ...e,
            monthly: (netIncome * (parseFloat(e.percentage) || 0)) / 100,
            yearly: ((netIncome * (parseFloat(e.percentage) || 0)) / 100) * 12
        }));
        
        const container = document.getElementById('finances-view');
        
        container.innerHTML = `
            <div class="view-header">
                <h2><i class="fas fa-chart-line"></i> Financial Dashboard</h2>
            </div>
            
            <!-- Summary Cards -->
            <div class="finance-summary">
                <div class="summary-card" style="border-left: 4px solid #4CAF50;">
                    <div class="summary-label">Gross Monthly Income</div>
                    <div class="summary-amount" style="color: #4CAF50;">$${grossIncome.toFixed(2)}</div>
                </div>
                <div class="summary-card" style="border-left: 4px solid #f44336;">
                    <div class="summary-label">Subscriptions Cost</div>
                    <div class="summary-amount" style="color: #f44336;">$${subscriptionsCost.toFixed(2)}</div>
                </div>
                <div class="summary-card" style="border-left: 4px solid #6C63FF;">
                    <div class="summary-label">Net Monthly Income</div>
                    <div class="summary-amount" style="color: #6C63FF;">$${netIncome.toFixed(2)}</div>
                </div>
            </div>
            
            <!-- Recurring Income Section -->
            <div class="finance-section">
                <div class="section-header">
                    <h3><i class="fas fa-hand-holding-usd"></i> Recurring Income</h3>
                    <button class="add-btn-small" onclick="window.modalManager.openRecurringIncomeModal()">
                        <i class="fas fa-plus"></i> Add Client Income
                    </button>
                </div>
                <div class="finance-table">
                    <div class="table-header">
                        <div class="table-col">Client Name</div>
                        <div class="table-col text-right">Monthly Payment</div>
                    </div>
                    ${recurringIncome.length === 0 ? '<div class="empty-message">No recurring income yet</div>' : 
                        recurringIncome.map(income => `
                            <div class="table-row" onclick="window.modalManager.openRecurringIncomeModal('${income.id}')">
                                <div class="table-col">${income.client_name}</div>
                                <div class="table-col text-right" style="color: #4CAF50; font-weight: 600;">$${parseFloat(income.monthly_payment).toFixed(2)}</div>
                            </div>
                        `).join('')
                    }
                </div>
            </div>
            
            <!-- Subscriptions Section -->
            <div class="finance-section">
                <div class="section-header">
                    <h3><i class="fas fa-receipt"></i> Subscriptions</h3>
                    <button class="add-btn-small" onclick="window.modalManager.openSubscriptionModal()">
                        <i class="fas fa-plus"></i> Add Subscription
                    </button>
                </div>
                <div class="finance-table">
                    <div class="table-header">
                        <div class="table-col">Subscription Name</div>
                        <div class="table-col text-right">Monthly Cost</div>
                    </div>
                    ${subscriptions.length === 0 ? '<div class="empty-message">No subscriptions yet</div>' : 
                        subscriptions.map(sub => `
                            <div class="table-row" onclick="window.modalManager.openSubscriptionModal('${sub.id}')">
                                <div class="table-col">${sub.name}</div>
                                <div class="table-col text-right" style="color: #f44336; font-weight: 600;">$${parseFloat(sub.monthly_cost).toFixed(2)}</div>
                            </div>
                        `).join('')
                    }
                </div>
            </div>
            
            <!-- Budget Allocation Section -->
            <div class="finance-section">
                <div class="section-header">
                    <h3><i class="fas fa-chart-pie"></i> Budget Allocation</h3>
                    <button class="add-btn-small" onclick="window.modalManager.openAllocationModal()">
                        <i class="fas fa-plus"></i> Add Allocation
                    </button>
                </div>
                <div class="finance-table">
                    <div class="table-header">
                        <div class="table-col">Allocation Category</div>
                        <div class="table-col text-right">Percentage</div>
                        <div class="table-col text-right">Allocated Amount</div>
                    </div>
                    ${allocationAmounts.length === 0 ? '<div class="empty-message">No allocations yet</div>' : 
                        allocationAmounts.map(alloc => `
                            <div class="table-row" onclick="window.modalManager.openAllocationModal('${alloc.id}')">
                                <div class="table-col">${alloc.category}</div>
                                <div class="table-col text-right">${parseFloat(alloc.percentage).toFixed(0)}%</div>
                                <div class="table-col text-right" style="color: #6C63FF; font-weight: 600;">$${alloc.amount.toFixed(2)}</div>
                            </div>
                        `).join('')
                    }
                </div>
            </div>
            
            <!-- Employees Section -->
            <div class="finance-section">
                <div class="section-header">
                    <h3><i class="fas fa-users"></i> Employee Payroll</h3>
                    <button class="add-btn-small" onclick="window.modalManager.openEmployeeModal()">
                        <i class="fas fa-plus"></i> Add Employee
                    </button>
                </div>
                <div class="finance-table">
                    <div class="table-header">
                        <div class="table-col">Employee Name</div>
                        <div class="table-col text-right">Percentage</div>
                        <div class="table-col text-right">Monthly Income</div>
                        <div class="table-col text-right">Yearly Income</div>
                    </div>
                    ${employeePayroll.length === 0 ? '<div class="empty-message">No employees yet</div>' : 
                        employeePayroll.map(emp => `
                            <div class="table-row" onclick="window.modalManager.openEmployeeModal('${emp.id}')">
                                <div class="table-col">${emp.name}</div>
                                <div class="table-col text-right">${parseFloat(emp.percentage).toFixed(0)}%</div>
                                <div class="table-col text-right" style="color: #4CAF50; font-weight: 600;">$${emp.monthly.toFixed(2)}</div>
                                <div class="table-col text-right" style="color: #4CAF50; font-weight: 600;">$${emp.yearly.toFixed(2)}</div>
                            </div>
                        `).join('')
                    }
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
