// View Manager - Renders different views
class ViewManager {
    getCurrentUser() {
        return localStorage.getItem('auctus_current_user') || null;
    }

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
        
        // Find "To Employees" allocation to use as the employee pool
        const employeeAllocation = allocations.find(a => {
            const cat = a.category.toLowerCase();
            return cat.includes('employee') || 
                   cat.includes('payroll') || 
                   cat.includes('to employee') ||
                   cat.includes('staff') ||
                   cat.includes('team');
        });
        const employeePool = employeeAllocation 
            ? (netIncome * (parseFloat(employeeAllocation.percentage) || 0)) / 100 
            : netIncome; // Fallback to net income if no employee allocation exists
        
        // Debug logging
        console.log('Employee Pool Calculation:', {
            allocations,
            employeeAllocation,
            netIncome,
            employeePool,
            'employeeAllocation.percentage': employeeAllocation?.percentage
        });
        
        // Calculate employee income from the employee pool
        const employeePayroll = employees.map(e => ({
            ...e,
            monthly: (employeePool * (parseFloat(e.percentage) || 0)) / 100,
            yearly: ((employeePool * (parseFloat(e.percentage) || 0)) / 100) * 12
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
                ${employeeAllocation ? `
                <div style="background: rgba(108, 99, 255, 0.1); padding: 0.75rem; border-radius: 8px; margin-bottom: 1rem; font-size: 0.875rem;">
                    <i class="fas fa-info-circle"></i> Employee Pool: <strong style="color: #6C63FF;">$${employeePool.toFixed(2)}</strong> 
                    (${parseFloat(employeeAllocation.percentage).toFixed(0)}% of Net Income: $${netIncome.toFixed(2)})
                    <br><span style="color: var(--text-secondary); font-size: 0.8rem;">Employee percentages are calculated from this pool amount from "${employeeAllocation.category}" allocation.</span>
                </div>
                ` : `
                <div style="background: rgba(255, 107, 107, 0.1); padding: 0.75rem; border-radius: 8px; margin-bottom: 1rem; font-size: 0.875rem; border-left: 3px solid #f44336;">
                    <i class="fas fa-exclamation-triangle"></i> <strong>Warning:</strong> No employee allocation found! 
                    <br><span style="color: var(--text-secondary); font-size: 0.8rem;">Create a budget allocation with "employee" or "payroll" in the name to set the employee pool. Currently using full net income ($${netIncome.toFixed(2)}).</span>
                </div>
                `}
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

    async renderSettingsView() {
        const container = document.getElementById('settings-view');
        
        container.innerHTML = `
            <div class="view-header">
                <h2><i class="fas fa-cog"></i> Settings & Tools</h2>
            </div>
            
            <div class="settings-grid">
                <!-- User Profile Section -->
                <div class="settings-card">
                    <div class="settings-card-header">
                        <i class="fas fa-user-circle"></i>
                        <h3>My Profile</h3>
                    </div>
                    <div class="settings-card-body">
                        <div class="settings-item">
                            <div class="settings-label">I am:</div>
                            <div class="settings-value" id="current-user-display">
                                ${this.getCurrentUser() || 'Not Set'}
                            </div>
                        </div>
                        <div class="settings-info">
                            <i class="fas fa-info-circle"></i> 
                            Set who you are on this device. Your notes will be private to you.
                        </div>
                        <div class="user-selector">
                            <button class="user-btn ${this.getCurrentUser() === 'Aiden' ? 'active' : ''}" 
                                onclick="window.app.setCurrentUser('Aiden')">
                                <i class="fas fa-user"></i> Aiden
                            </button>
                            <button class="user-btn ${this.getCurrentUser() === 'Nick' ? 'active' : ''}" 
                                onclick="window.app.setCurrentUser('Nick')">
                                <i class="fas fa-user"></i> Nick
                            </button>
                        </div>
                    </div>
                </div>

                <!-- UI Preferences Section -->
                <div class="settings-card">
                    <div class="settings-card-header">
                        <i class="fas fa-paint-brush"></i>
                        <h3>UI Preferences</h3>
                    </div>
                    <div class="settings-card-body">
                        <div class="settings-description">Customize your app interface</div>
                        <div class="settings-item">
                            <div class="settings-label">
                                <i class="fas fa-sticky-note"></i> Quick Note Button
                            </div>
                            <label class="toggle-switch">
                                <input type="checkbox" id="quick-note-toggle" 
                                    ${localStorage.getItem('show_quick_note') !== 'false' ? 'checked' : ''}
                                    onchange="window.app.toggleQuickNoteButton(this.checked)">
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                    </div>
                </div>

                <!-- Company Info Section -->
                <div class="settings-card">
                    <div class="settings-card-header">
                        <i class="fas fa-building"></i>
                        <h3>Company Information</h3>
                    </div>
                    <div class="settings-card-body">
                        <div class="settings-item">
                            <div class="settings-label">Company Name</div>
                            <div class="settings-value">Auctus Ventures</div>
                        </div>
                        <div class="settings-item">
                            <div class="settings-label">Founded</div>
                            <div class="settings-value">2024</div>
                        </div>
                        <div class="settings-item">
                            <div class="settings-label">Services</div>
                            <div class="settings-value">Website Development & AI Models</div>
                        </div>
                        <button class="btn-secondary" onclick="alert('Company settings coming soon!')">
                            <i class="fas fa-edit"></i> Edit Company Info
                        </button>
                    </div>
                </div>

                <!-- Database Tools -->
                <div class="settings-card">
                    <div class="settings-card-header">
                        <i class="fas fa-database"></i>
                        <h3>Database Tools</h3>
                    </div>
                    <div class="settings-card-body">
                        <p class="settings-description">Manage your database and data</p>
                        <button class="btn-secondary" onclick="window.open('/.netlify/functions/db-init', '_blank')">
                            <i class="fas fa-sync"></i> Initialize Database Tables
                        </button>
                        <button class="btn-secondary" onclick="if(confirm('This will export all your data to a JSON file. Continue?')) alert('Export feature coming soon!')">
                            <i class="fas fa-download"></i> Export All Data
                        </button>
                        <button class="btn-secondary" onclick="alert('Import feature coming soon!')">
                            <i class="fas fa-upload"></i> Import Data
                        </button>
                    </div>
                </div>

                <!-- Reports & Analytics -->
                <div class="settings-card">
                    <div class="settings-card-header">
                        <i class="fas fa-chart-bar"></i>
                        <h3>Reports & Analytics</h3>
                    </div>
                    <div class="settings-card-body">
                        <p class="settings-description">Generate business reports and insights</p>
                        <button class="btn-secondary" onclick="alert('Monthly financial report coming soon!')">
                            <i class="fas fa-file-invoice-dollar"></i> Monthly Financial Report
                        </button>
                        <button class="btn-secondary" onclick="alert('Client report coming soon!')">
                            <i class="fas fa-users"></i> Client Activity Report
                        </button>
                        <button class="btn-secondary" onclick="alert('Project timeline coming soon!')">
                            <i class="fas fa-project-diagram"></i> Project Timeline Report
                        </button>
                    </div>
                </div>

                <!-- Quick Links -->
                <div class="settings-card">
                    <div class="settings-card-header">
                        <i class="fas fa-link"></i>
                        <h3>Quick Links</h3>
                    </div>
                    <div class="settings-card-body">
                        <p class="settings-description">External resources and tools</p>
                        <button class="btn-secondary" onclick="window.open('https://console.neon.tech', '_blank')">
                            <i class="fas fa-external-link-alt"></i> Neon Database Console
                        </button>
                        <button class="btn-secondary" onclick="window.open('https://app.netlify.com', '_blank')">
                            <i class="fas fa-external-link-alt"></i> Netlify Dashboard
                        </button>
                        <button class="btn-secondary" onclick="window.open('https://github.com/AidenBurnzy/AuctusAPP', '_blank')">
                            <i class="fab fa-github"></i> GitHub Repository
                        </button>
                    </div>
                </div>

                <!-- Team Management -->
                <div class="settings-card">
                    <div class="settings-card-header">
                        <i class="fas fa-user-friends"></i>
                        <h3>Team Management</h3>
                    </div>
                    <div class="settings-card-body">
                        <div class="settings-item">
                            <div class="settings-label">Team Members</div>
                            <div class="settings-value">Aiden, Nick</div>
                        </div>
                        <div class="settings-item">
                            <div class="settings-label">Roles</div>
                            <div class="settings-value">Co-Founders</div>
                        </div>
                        <button class="btn-secondary" onclick="window.app.switchView('finances'); setTimeout(() => { const employeeSection = document.querySelector('.finance-section:nth-child(5)'); if(employeeSection) employeeSection.scrollIntoView({behavior: 'smooth'}); }, 100)">
                            <i class="fas fa-arrow-right"></i> View Employee Payroll
                        </button>
                    </div>
                </div>

                <!-- App Settings -->
                <div class="settings-card">
                    <div class="settings-card-header">
                        <i class="fas fa-sliders-h"></i>
                        <h3>App Settings</h3>
                    </div>
                    <div class="settings-card-body">
                        <div class="settings-item">
                            <div class="settings-label">App Version</div>
                            <div class="settings-value">v1.0 (Oct 2025)</div>
                        </div>
                        <div class="settings-item">
                            <div class="settings-label">Database</div>
                            <div class="settings-value">Neon PostgreSQL</div>
                        </div>
                        <div class="settings-item">
                            <div class="settings-label">Hosting</div>
                            <div class="settings-value">Netlify</div>
                        </div>
                        <button class="btn-secondary" onclick="if(confirm('This will clear all cached data and reload the app. Continue?')) window.location.reload(true)">
                            <i class="fas fa-redo"></i> Clear Cache & Reload
                        </button>
                    </div>
                </div>

                <!-- Help & Support -->
                <div class="settings-card">
                    <div class="settings-card-header">
                        <i class="fas fa-question-circle"></i>
                        <h3>Help & Support</h3>
                    </div>
                    <div class="settings-card-body">
                        <p class="settings-description">Documentation and resources</p>
                        <button class="btn-secondary" onclick="window.open('https://github.com/AidenBurnzy/AuctusAPP/blob/main/FINANCIAL_SYSTEM_GUIDE.md', '_blank')">
                            <i class="fas fa-book"></i> Financial System Guide
                        </button>
                        <button class="btn-secondary" onclick="window.open('https://github.com/AidenBurnzy/AuctusAPP/blob/main/README.md', '_blank')">
                            <i class="fas fa-file-alt"></i> Documentation
                        </button>
                        <button class="btn-secondary" onclick="window.app.switchView('dashboard')">
                            <i class="fas fa-home"></i> Back to Dashboard
                        </button>
                    </div>
                </div>

                <!-- Backup & Security -->
                <div class="settings-card">
                    <div class="settings-card-header">
                        <i class="fas fa-shield-alt"></i>
                        <h3>Backup & Security</h3>
                    </div>
                    <div class="settings-card-body">
                        <div class="settings-item">
                            <div class="settings-label">Last Backup</div>
                            <div class="settings-value">Auto (Neon)</div>
                        </div>
                        <div class="settings-item">
                            <div class="settings-label">Data Sync</div>
                            <div class="settings-value status-active">Active</div>
                        </div>
                        <button class="btn-secondary" onclick="alert('Manual backup feature coming soon!')">
                            <i class="fas fa-cloud-upload-alt"></i> Create Manual Backup
                        </button>
                    </div>
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

    async renderNotesView() {
        const container = document.getElementById('notes-view');
        const allNotes = await window.storageManager.getNotes();
        const currentUser = this.getCurrentUser();
        
        // Filter notes by current user if set
        const notes = currentUser 
            ? (Array.isArray(allNotes) ? allNotes.filter(n => n.created_by === currentUser) : [])
            : allNotes;
        
        const pendingNotes = Array.isArray(notes) ? notes.filter(n => !n.is_completed) : [];
        const completedNotes = Array.isArray(notes) ? notes.filter(n => n.is_completed) : [];
        
        container.innerHTML = `
            <div class="view-header">
                <h2><i class="fas fa-sticky-note"></i> Notes & Reminders</h2>
                <button class="add-btn" onclick="window.modalManager.openNoteModal()">
                    <i class="fas fa-plus"></i> Add Note
                </button>
            </div>
            
            ${currentUser ? `
                <div class="notes-filter-info">
                    <i class="fas fa-user-circle"></i> 
                    Showing notes for: <strong>${currentUser}</strong>
                    <span class="filter-hint">Other users' notes are hidden. Change in Settings.</span>
                </div>
            ` : `
                <div class="notes-filter-warning">
                    <i class="fas fa-exclamation-triangle"></i> 
                    <strong>No user profile set!</strong> Go to Settings to select Aiden or Nick to see only your notes.
                </div>
            `}
            
            <div class="notes-section">
                <h3 class="section-title"><i class="fas fa-tasks"></i> Pending (${pendingNotes.length})</h3>
                <div class="notes-list">
                    ${pendingNotes.length === 0 ? `
                        <div class="empty-state">
                            <i class="fas fa-clipboard-list"></i>
                            <p>No pending notes. Add a reminder or note!</p>
                        </div>
                    ` : pendingNotes.map(note => `
                        <div class="note-card" data-id="${note.id}">
                            <div class="note-checkbox">
                                <input type="checkbox" ${note.is_completed ? 'checked' : ''} 
                                    onchange="window.storageManager.toggleNoteComplete(${note.id}).then(() => window.viewManager.renderNotesView())">
                            </div>
                            <div class="note-content" onclick="window.modalManager.openNoteModal(${note.id})">
                                <h4>${note.title}</h4>
                                ${note.content ? `<p>${note.content}</p>` : ''}
                                <div class="note-meta">
                                    <span class="note-priority priority-${note.priority}">
                                        <i class="fas fa-flag"></i> ${note.priority}
                                    </span>
                                    ${note.created_by ? `<span><i class="fas fa-user"></i> ${note.created_by}</span>` : ''}
                                    <span><i class="fas fa-clock"></i> ${new Date(note.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                            <div class="note-actions">
                                <button class="icon-btn" onclick="window.modalManager.openNoteModal(${note.id})" title="Edit">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="icon-btn" onclick="window.modalManager.deleteNote(${note.id})" title="Delete">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            ${completedNotes.length > 0 ? `
                <div class="notes-section">
                    <h3 class="section-title"><i class="fas fa-check-circle"></i> Completed (${completedNotes.length})</h3>
                    <div class="notes-list">
                        ${completedNotes.map(note => `
                            <div class="note-card completed" data-id="${note.id}">
                                <div class="note-checkbox">
                                    <input type="checkbox" checked 
                                        onchange="window.storageManager.toggleNoteComplete(${note.id}).then(() => window.viewManager.renderNotesView())">
                                </div>
                                <div class="note-content" onclick="window.modalManager.openNoteModal(${note.id})">
                                    <h4>${note.title}</h4>
                                    ${note.content ? `<p>${note.content}</p>` : ''}
                                    <div class="note-meta">
                                        <span class="note-priority priority-${note.priority}">
                                            <i class="fas fa-flag"></i> ${note.priority}
                                        </span>
                                        ${note.created_by ? `<span><i class="fas fa-user"></i> ${note.created_by}</span>` : ''}
                                        <span><i class="fas fa-clock"></i> ${new Date(note.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <div class="note-actions">
                                    <button class="icon-btn" onclick="window.modalManager.deleteNote(${note.id})" title="Delete">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        `;
    }
}

// Initialize view manager
window.viewManager = new ViewManager();
