// Main App Logic
class AuctusApp {
    constructor() {
        this.currentView = 'dashboard';
        this.init();
    }

    init() {
        // Hide loading screen after delay
        setTimeout(() => {
            document.getElementById('loading-screen').style.display = 'none';
            document.getElementById('app').style.display = 'flex';
            this.setupEventListeners();
            this.updateStats();
        }, 1500);
    }

    setupEventListeners() {
        // Navigation buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.currentTarget.dataset.view;
                this.switchView(view);
            });
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
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-view="${viewName}"]`).classList.add('active');

        // Update views
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });

        const targetView = document.getElementById(`${viewName}-view`);
        targetView.classList.add('active');

        this.currentView = viewName;

        // Load view content
        this.loadViewContent(viewName);
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
