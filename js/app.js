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
        }
    }

    async updateStats() {
        const clients = await window.storageManager.getClients();
        const projects = await window.storageManager.getProjects();
        const websites = await window.storageManager.getWebsites();
        const ideas = await window.storageManager.getIdeas();

        document.getElementById('total-clients').textContent = clients.length;
        document.getElementById('active-projects').textContent = 
            projects.filter(p => p.status === 'active').length;
        document.getElementById('total-websites').textContent = websites.length;
        document.getElementById('total-ideas').textContent = ideas.length;
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new AuctusApp();
});
