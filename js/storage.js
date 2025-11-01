// Storage Manager with API Support
class StorageManager {
    constructor() {
        this.API_BASE = '/.netlify/functions';
        this.USE_API = true; // Set to false to use localStorage only
        this.debug = false;
        this.initializeStorage();
    }

    logDebug(...args) {
        if (!this.debug) {
            return;
        }
        console.log(...args);
    }

    initializeStorage() {
        if (!localStorage.getItem('auctus_clients')) {
            localStorage.setItem('auctus_clients', JSON.stringify([]));
        }
        if (!localStorage.getItem('auctus_projects')) {
            localStorage.setItem('auctus_projects', JSON.stringify([]));
        }
        if (!localStorage.getItem('auctus_websites')) {
            localStorage.setItem('auctus_websites', JSON.stringify([]));
        }
        if (!localStorage.getItem('auctus_finances')) {
            localStorage.setItem('auctus_finances', JSON.stringify([]));
        }
        if (!localStorage.getItem('auctus_recurring_income')) {
            localStorage.setItem('auctus_recurring_income', JSON.stringify([]));
        }
        if (!localStorage.getItem('auctus_subscriptions')) {
            localStorage.setItem('auctus_subscriptions', JSON.stringify([]));
        }
        if (!localStorage.getItem('auctus_allocations')) {
            localStorage.setItem('auctus_allocations', JSON.stringify([]));
        }
        if (!localStorage.getItem('auctus_employees')) {
            localStorage.setItem('auctus_employees', JSON.stringify([]));
        }
        if (!localStorage.getItem('auctus_notes')) {
            localStorage.setItem('auctus_notes', JSON.stringify([]));
        }
    }

    async apiRequest(endpoint, method = 'GET', data = null) {
    const url = `${this.API_BASE}/${endpoint}`;
    this.logDebug(`API Request: ${method} ${url}`);
        try {
            const options = {
                method,
                headers: { 'Content-Type': 'application/json' }
            };
            
            // Add JWT token to Authorization header if available
            const token = localStorage.getItem('auctus_token');
            if (token) {
                options.headers['Authorization'] = `Bearer ${token}`;
            }
            
            if (data) {
                options.body = JSON.stringify(data);
                this.logDebug('Request data:', data);
            }
            const response = await fetch(url, options);
            this.logDebug(`API Response: ${response.status} ${response.statusText}`);
            
            // Get the response text first
            const responseText = await response.text();
            this.logDebug('Raw API response:', responseText);
            
            if (!response.ok) {
                console.error('API error response:', responseText);
                throw new Error(`API error: ${response.status} - ${responseText}`);
            }
            
            // Try to parse as JSON
            let result;
            try {
                result = JSON.parse(responseText);
                this.logDebug('Parsed API result:', result, 'Type:', typeof result, 'Is Array:', Array.isArray(result));
            } catch (parseError) {
                console.error('Failed to parse JSON:', parseError);
                throw new Error('Invalid JSON response from API');
            }
            
            return result;
        } catch (error) {
            console.error('API request failed:', error.message);
            console.error('Full error:', error);
            this.USE_API = false; // Fallback to localStorage on API failure
            throw error;
        }
    }

    // Clients
    async getClients() {
        if (this.USE_API) {
            try {
                this.logDebug('[StorageManager] Fetching clients from API...');
                const result = await this.apiRequest('clients');
                this.logDebug('[StorageManager] API returned clients:', result);
                // Update localStorage as cache
                if (Array.isArray(result)) {
                    localStorage.setItem('auctus_clients', JSON.stringify(result));
                }
                return Array.isArray(result) ? result : [];
            } catch (error) {
                console.error('[StorageManager] API failed, using localStorage:', error);
                return JSON.parse(localStorage.getItem('auctus_clients') || '[]');
            }
        }
    this.logDebug('[StorageManager] Using localStorage directly for clients');
        return JSON.parse(localStorage.getItem('auctus_clients') || '[]');
    }

    async addClient(client) {
    this.logDebug('[StorageManager] Adding client:', client);
        if (this.USE_API) {
            try {
                const result = await this.apiRequest('clients', 'POST', client);
                this.logDebug('[StorageManager] Client added via API:', result);
                // Refresh cache
                await this.getClients();
                return result;
            } catch (error) {
                console.error('[StorageManager] API failed for addClient, using localStorage:', error);
                // Fallback to localStorage
            }
        }
        const clients = await this.getClients();
        client.id = Date.now().toString();
        client.createdAt = new Date().toISOString();
        clients.push(client);
        localStorage.setItem('auctus_clients', JSON.stringify(clients));
    this.logDebug('[StorageManager] Client added to localStorage:', client);
        return client;
    }

    async updateClient(id, updatedClient) {
        if (this.USE_API) {
            try {
                return await this.apiRequest('clients', 'PUT', { id, ...updatedClient });
            } catch (error) {
                // Fallback to localStorage
            }
        }
        const clients = await this.getClients();
        const index = clients.findIndex(c => c.id === id);
        if (index !== -1) {
            clients[index] = { ...clients[index], ...updatedClient, updatedAt: new Date().toISOString() };
            localStorage.setItem('auctus_clients', JSON.stringify(clients));
        }
    }

    async deleteClient(id) {
        if (this.USE_API) {
            try {
                return await this.apiRequest('clients', 'DELETE', { id });
            } catch (error) {
                // Fallback to localStorage
            }
        }
        const clients = await this.getClients();
        const filtered = clients.filter(c => c.id !== id);
        localStorage.setItem('auctus_clients', JSON.stringify(filtered));
    }

    // Projects
    async getProjects() {
        if (this.USE_API) {
            try {
                const result = await this.apiRequest('projects');
                return Array.isArray(result) ? result : [];
            } catch (error) {
                return JSON.parse(localStorage.getItem('auctus_projects') || '[]');
            }
        }
        return JSON.parse(localStorage.getItem('auctus_projects') || '[]');
    }

    async addProject(project) {
        if (this.USE_API) {
            try {
                return await this.apiRequest('projects', 'POST', project);
            } catch (error) {
                // Fallback
            }
        }
        const projects = await this.getProjects();
        project.id = Date.now().toString();
        project.createdAt = new Date().toISOString();
        projects.push(project);
        localStorage.setItem('auctus_projects', JSON.stringify(projects));
        return project;
    }

    async updateProject(id, updatedProject) {
        if (this.USE_API) {
            try {
                return await this.apiRequest('projects', 'PUT', { id, ...updatedProject });
            } catch (error) {
                // Fallback
            }
        }
        const projects = await this.getProjects();
        const index = projects.findIndex(p => p.id === id);
        if (index !== -1) {
            projects[index] = { ...projects[index], ...updatedProject, updatedAt: new Date().toISOString() };
            localStorage.setItem('auctus_projects', JSON.stringify(projects));
        }
    }

    async deleteProject(id) {
        if (this.USE_API) {
            try {
                return await this.apiRequest('projects', 'DELETE', { id });
            } catch (error) {
                // Fallback
            }
        }
        const projects = await this.getProjects();
        const filtered = projects.filter(p => p.id !== id);
        localStorage.setItem('auctus_projects', JSON.stringify(filtered));
    }

    // Websites
    async getWebsites() {
        if (this.USE_API) {
            try {
                const result = await this.apiRequest('websites');
                return Array.isArray(result) ? result : [];
            } catch (error) {
                return JSON.parse(localStorage.getItem('auctus_websites') || '[]');
            }
        }
        return JSON.parse(localStorage.getItem('auctus_websites') || '[]');
    }

    async addWebsite(website) {
        if (this.USE_API) {
            try {
                return await this.apiRequest('websites', 'POST', website);
            } catch (error) {
                // Fallback
            }
        }
        const websites = await this.getWebsites();
        website.id = Date.now().toString();
        website.createdAt = new Date().toISOString();
        websites.push(website);
        localStorage.setItem('auctus_websites', JSON.stringify(websites));
        return website;
    }

    async updateWebsite(id, updatedWebsite) {
        if (this.USE_API) {
            try {
                return await this.apiRequest('websites', 'PUT', { id, ...updatedWebsite });
            } catch (error) {
                // Fallback
            }
        }
        const websites = await this.getWebsites();
        const index = websites.findIndex(w => w.id === id);
        if (index !== -1) {
            websites[index] = { ...websites[index], ...updatedWebsite, updatedAt: new Date().toISOString() };
            localStorage.setItem('auctus_websites', JSON.stringify(websites));
        }
    }

    async deleteWebsite(id) {
        if (this.USE_API) {
            try {
                return await this.apiRequest('websites', 'DELETE', { id });
            } catch (error) {
                // Fallback
            }
        }
        const websites = await this.getWebsites();
        const filtered = websites.filter(w => w.id !== id);
        localStorage.setItem('auctus_websites', JSON.stringify(filtered));
    }

    // Finances
    async getFinances() {
        if (this.USE_API) {
            try {
                const result = await this.apiRequest('finances');
                return Array.isArray(result) ? result : [];
            } catch (error) {
                return JSON.parse(localStorage.getItem('auctus_finances') || '[]');
            }
        }
        return JSON.parse(localStorage.getItem('auctus_finances') || '[]');
    }

    async addFinance(finance) {
        if (this.USE_API) {
            try {
                return await this.apiRequest('finances', 'POST', finance);
            } catch (error) {
                // Fallback
            }
        }
        const finances = await this.getFinances();
        finance.id = Date.now().toString();
        finance.createdAt = new Date().toISOString();
        finances.push(finance);
        localStorage.setItem('auctus_finances', JSON.stringify(finances));
        return finance;
    }

    async updateFinance(id, updatedFinance) {
        if (this.USE_API) {
            try {
                return await this.apiRequest('finances', 'PUT', { id, ...updatedFinance });
            } catch (error) {
                // Fallback
            }
        }
        const finances = await this.getFinances();
        const index = finances.findIndex(f => f.id === id);
        if (index !== -1) {
            finances[index] = { ...finances[index], ...updatedFinance, updatedAt: new Date().toISOString() };
            localStorage.setItem('auctus_finances', JSON.stringify(finances));
        }
    }

    async deleteFinance(id) {
        if (this.USE_API) {
            try {
                return await this.apiRequest('finances', 'DELETE', { id });
            } catch (error) {
                // Fallback
            }
        }
        const finances = await this.getFinances();
        const filtered = finances.filter(f => f.id !== id);
        localStorage.setItem('auctus_finances', JSON.stringify(filtered));
    }

    // Recurring Income
    async getRecurringIncome() {
        if (this.USE_API) {
            try {
                const result = await this.apiRequest('recurring-income');
                return Array.isArray(result) ? result : [];
            } catch (error) {
                return JSON.parse(localStorage.getItem('auctus_recurring_income') || '[]');
            }
        }
        return JSON.parse(localStorage.getItem('auctus_recurring_income') || '[]');
    }

    async addRecurringIncome(income) {
        if (this.USE_API) {
            try {
                return await this.apiRequest('recurring-income', 'POST', income);
            } catch (error) {
                // Fallback
            }
        }
        const incomes = await this.getRecurringIncome();
        income.id = Date.now().toString();
        incomes.push(income);
        localStorage.setItem('auctus_recurring_income', JSON.stringify(incomes));
        return income;
    }

    async updateRecurringIncome(id, updatedIncome) {
        if (this.USE_API) {
            try {
                return await this.apiRequest('recurring-income', 'PUT', { ...updatedIncome, id });
            } catch (error) {
                // Fallback
            }
        }
        const incomes = await this.getRecurringIncome();
        const index = incomes.findIndex(i => i.id === id);
        if (index !== -1) {
            incomes[index] = { ...incomes[index], ...updatedIncome };
            localStorage.setItem('auctus_recurring_income', JSON.stringify(incomes));
        }
    }

    async deleteRecurringIncome(id) {
        if (this.USE_API) {
            try {
                return await this.apiRequest('recurring-income', 'DELETE', { id });
            } catch (error) {
                // Fallback
            }
        }
        const incomes = await this.getRecurringIncome();
        const filtered = incomes.filter(i => i.id !== id);
        localStorage.setItem('auctus_recurring_income', JSON.stringify(filtered));
    }

    // Subscriptions
    async getSubscriptions() {
        if (this.USE_API) {
            try {
                const result = await this.apiRequest('subscriptions');
                return Array.isArray(result) ? result : [];
            } catch (error) {
                return JSON.parse(localStorage.getItem('auctus_subscriptions') || '[]');
            }
        }
        return JSON.parse(localStorage.getItem('auctus_subscriptions') || '[]');
    }

    async addSubscription(subscription) {
        if (this.USE_API) {
            try {
                return await this.apiRequest('subscriptions', 'POST', subscription);
            } catch (error) {
                // Fallback
            }
        }
        const subscriptions = await this.getSubscriptions();
        subscription.id = Date.now().toString();
        subscriptions.push(subscription);
        localStorage.setItem('auctus_subscriptions', JSON.stringify(subscriptions));
        return subscription;
    }

    async updateSubscription(id, updatedSubscription) {
        if (this.USE_API) {
            try {
                return await this.apiRequest('subscriptions', 'PUT', { ...updatedSubscription, id });
            } catch (error) {
                // Fallback
            }
        }
        const subscriptions = await this.getSubscriptions();
        const index = subscriptions.findIndex(s => s.id === id);
        if (index !== -1) {
            subscriptions[index] = { ...subscriptions[index], ...updatedSubscription };
            localStorage.setItem('auctus_subscriptions', JSON.stringify(subscriptions));
        }
    }

    async deleteSubscription(id) {
        if (this.USE_API) {
            try {
                return await this.apiRequest('subscriptions', 'DELETE', { id });
            } catch (error) {
                // Fallback
            }
        }
        const subscriptions = await this.getSubscriptions();
        const filtered = subscriptions.filter(s => s.id !== id);
        localStorage.setItem('auctus_subscriptions', JSON.stringify(filtered));
    }

    // Budget Allocations
    async getAllocations() {
        if (this.USE_API) {
            try {
                const result = await this.apiRequest('allocations');
                return Array.isArray(result) ? result : [];
            } catch (error) {
                return JSON.parse(localStorage.getItem('auctus_allocations') || '[]');
            }
        }
        return JSON.parse(localStorage.getItem('auctus_allocations') || '[]');
    }

    async addAllocation(allocation) {
        if (this.USE_API) {
            try {
                return await this.apiRequest('allocations', 'POST', allocation);
            } catch (error) {
                // Fallback
            }
        }
        const allocations = await this.getAllocations();
        allocation.id = Date.now().toString();
        allocations.push(allocation);
        localStorage.setItem('auctus_allocations', JSON.stringify(allocations));
        return allocation;
    }

    async updateAllocation(id, updatedAllocation) {
        if (this.USE_API) {
            try {
                return await this.apiRequest('allocations', 'PUT', { ...updatedAllocation, id });
            } catch (error) {
                // Fallback
            }
        }
        const allocations = await this.getAllocations();
        const index = allocations.findIndex(a => a.id === id);
        if (index !== -1) {
            allocations[index] = { ...allocations[index], ...updatedAllocation };
            localStorage.setItem('auctus_allocations', JSON.stringify(allocations));
        }
    }

    async deleteAllocation(id) {
        if (this.USE_API) {
            try {
                return await this.apiRequest('allocations', 'DELETE', { id });
            } catch (error) {
                // Fallback
            }
        }
        const allocations = await this.getAllocations();
        const filtered = allocations.filter(a => a.id !== id);
        localStorage.setItem('auctus_allocations', JSON.stringify(filtered));
    }

    // Employees
    async getEmployees() {
        if (this.USE_API) {
            try {
                const result = await this.apiRequest('employees');
                return Array.isArray(result) ? result : [];
            } catch (error) {
                return JSON.parse(localStorage.getItem('auctus_employees') || '[]');
            }
        }
        return JSON.parse(localStorage.getItem('auctus_employees') || '[]');
    }

    async addEmployee(employee) {
        if (this.USE_API) {
            try {
                return await this.apiRequest('employees', 'POST', employee);
            } catch (error) {
                // Fallback
            }
        }
        const employees = await this.getEmployees();
        employee.id = Date.now().toString();
        employees.push(employee);
        localStorage.setItem('auctus_employees', JSON.stringify(employees));
        return employee;
    }

    async updateEmployee(id, updatedEmployee) {
        if (this.USE_API) {
            try {
                return await this.apiRequest('employees', 'PUT', { ...updatedEmployee, id });
            } catch (error) {
                // Fallback
            }
        }
        const employees = await this.getEmployees();
        const index = employees.findIndex(e => e.id === id);
        if (index !== -1) {
            employees[index] = { ...employees[index], ...updatedEmployee };
            localStorage.setItem('auctus_employees', JSON.stringify(employees));
        }
    }

    async deleteEmployee(id) {
        if (this.USE_API) {
            try {
                return await this.apiRequest('employees', 'DELETE', { id });
            } catch (error) {
                // Fallback
            }
        }
        const employees = await this.getEmployees();
        const filtered = employees.filter(e => e.id !== id);
        localStorage.setItem('auctus_employees', JSON.stringify(filtered));
    }

    // Notes methods
    async getNotes() {
        if (this.USE_API) {
            try {
                const notes = await this.apiRequest('notes');
                return Array.isArray(notes) ? notes : [];
            } catch (error) {
                console.error('Error fetching notes:', error);
            }
        }
        const notes = localStorage.getItem('auctus_notes');
        return notes ? JSON.parse(notes) : [];
    }

    async addNote(note) {
        if (this.USE_API) {
            try {
                return await this.apiRequest('notes', 'POST', note);
            } catch (error) {
                // Fallback
            }
        }
        const notes = await this.getNotes();
        const newNote = {
            ...note,
            id: Date.now(),
            created_at: new Date().toISOString(),
            is_completed: false
        };
        notes.push(newNote);
        localStorage.setItem('auctus_notes', JSON.stringify(notes));
        return newNote;
    }

    async updateNote(id, updatedNote) {
        if (this.USE_API) {
            try {
                return await this.apiRequest('notes', 'PUT', { id, ...updatedNote });
            } catch (error) {
                // Fallback
            }
        }
        const notes = await this.getNotes();
        const index = notes.findIndex(n => n.id == id);
        if (index !== -1) {
            notes[index] = { ...notes[index], ...updatedNote, updated_at: new Date().toISOString() };
            localStorage.setItem('auctus_notes', JSON.stringify(notes));
            return notes[index];
        }
    }

    async deleteNote(id) {
        if (this.USE_API) {
            try {
                return await this.apiRequest('notes', 'DELETE', { id });
            } catch (error) {
                // Fallback
            }
        }
        const notes = await this.getNotes();
        const filtered = notes.filter(n => n.id != id);
        localStorage.setItem('auctus_notes', JSON.stringify(filtered));
    }

    async toggleNoteComplete(id) {
        const notes = await this.getNotes();
        const note = notes.find(n => n.id == id);
        if (note) {
            return await this.updateNote(id, { ...note, is_completed: !note.is_completed });
        }
    }
}

// Initialize storage manager
window.storageManager = new StorageManager();
