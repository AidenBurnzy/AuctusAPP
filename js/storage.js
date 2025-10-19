// Local Storage Manager
class StorageManager {
    constructor() {
        this.initializeStorage();
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
        if (!localStorage.getItem('auctus_ideas')) {
            localStorage.setItem('auctus_ideas', JSON.stringify([]));
        }
    }

    // Clients
    getClients() {
        return JSON.parse(localStorage.getItem('auctus_clients') || '[]');
    }

    addClient(client) {
        const clients = this.getClients();
        client.id = Date.now().toString();
        client.createdAt = new Date().toISOString();
        clients.push(client);
        localStorage.setItem('auctus_clients', JSON.stringify(clients));
        return client;
    }

    updateClient(id, updatedClient) {
        const clients = this.getClients();
        const index = clients.findIndex(c => c.id === id);
        if (index !== -1) {
            clients[index] = { ...clients[index], ...updatedClient, updatedAt: new Date().toISOString() };
            localStorage.setItem('auctus_clients', JSON.stringify(clients));
        }
    }

    deleteClient(id) {
        const clients = this.getClients().filter(c => c.id !== id);
        localStorage.setItem('auctus_clients', JSON.stringify(clients));
    }

    // Projects
    getProjects() {
        return JSON.parse(localStorage.getItem('auctus_projects') || '[]');
    }

    addProject(project) {
        const projects = this.getProjects();
        project.id = Date.now().toString();
        project.createdAt = new Date().toISOString();
        projects.push(project);
        localStorage.setItem('auctus_projects', JSON.stringify(projects));
        return project;
    }

    updateProject(id, updatedProject) {
        const projects = this.getProjects();
        const index = projects.findIndex(p => p.id === id);
        if (index !== -1) {
            projects[index] = { ...projects[index], ...updatedProject, updatedAt: new Date().toISOString() };
            localStorage.setItem('auctus_projects', JSON.stringify(projects));
        }
    }

    deleteProject(id) {
        const projects = this.getProjects().filter(p => p.id !== id);
        localStorage.setItem('auctus_projects', JSON.stringify(projects));
    }

    // Websites
    getWebsites() {
        return JSON.parse(localStorage.getItem('auctus_websites') || '[]');
    }

    addWebsite(website) {
        const websites = this.getWebsites();
        website.id = Date.now().toString();
        website.createdAt = new Date().toISOString();
        websites.push(website);
        localStorage.setItem('auctus_websites', JSON.stringify(websites));
        return website;
    }

    updateWebsite(id, updatedWebsite) {
        const websites = this.getWebsites();
        const index = websites.findIndex(w => w.id === id);
        if (index !== -1) {
            websites[index] = { ...websites[index], ...updatedWebsite, updatedAt: new Date().toISOString() };
            localStorage.setItem('auctus_websites', JSON.stringify(websites));
        }
    }

    deleteWebsite(id) {
        const websites = this.getWebsites().filter(w => w.id !== id);
        localStorage.setItem('auctus_websites', JSON.stringify(websites));
    }

    // Ideas
    getIdeas() {
        return JSON.parse(localStorage.getItem('auctus_ideas') || '[]');
    }

    addIdea(idea) {
        const ideas = this.getIdeas();
        idea.id = Date.now().toString();
        idea.createdAt = new Date().toISOString();
        ideas.push(idea);
        localStorage.setItem('auctus_ideas', JSON.stringify(ideas));
        return idea;
    }

    updateIdea(id, updatedIdea) {
        const ideas = this.getIdeas();
        const index = ideas.findIndex(i => i.id === id);
        if (index !== -1) {
            ideas[index] = { ...ideas[index], ...updatedIdea, updatedAt: new Date().toISOString() };
            localStorage.setItem('auctus_ideas', JSON.stringify(ideas));
        }
    }

    deleteIdea(id) {
        const ideas = this.getIdeas().filter(i => i.id !== id);
        localStorage.setItem('auctus_ideas', JSON.stringify(ideas));
    }
}

// Initialize storage manager
window.storageManager = new StorageManager();
