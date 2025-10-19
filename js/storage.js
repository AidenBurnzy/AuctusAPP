// Storage Manager with API Support
class StorageManager {
    constructor() {
        this.API_BASE = '/.netlify/functions';
        this.USE_API = true; // Set to false to use localStorage only
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

    async apiRequest(endpoint, method = 'GET', data = null) {
        try {
            const options = {
                method,
                headers: { 'Content-Type': 'application/json' }
            };
            if (data) {
                options.body = JSON.stringify(data);
            }
            const response = await fetch(`${this.API_BASE}/${endpoint}`, options);
            if (!response.ok) throw new Error(`API error: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('API request failed, falling back to localStorage:', error);
            this.USE_API = false; // Fallback to localStorage on API failure
            throw error;
        }
    }

    // Clients
    async getClients() {
        if (this.USE_API) {
            try {
                return await this.apiRequest('clients');
            } catch (error) {
                return JSON.parse(localStorage.getItem('auctus_clients') || '[]');
            }
        }
        return JSON.parse(localStorage.getItem('auctus_clients') || '[]');
    }

    async addClient(client) {
        if (this.USE_API) {
            try {
                return await this.apiRequest('clients', 'POST', client);
            } catch (error) {
                // Fallback to localStorage
            }
        }
        const clients = await this.getClients();
        client.id = Date.now().toString();
        client.createdAt = new Date().toISOString();
        clients.push(client);
        localStorage.setItem('auctus_clients', JSON.stringify(clients));
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
                return await this.apiRequest('projects');
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
                return await this.apiRequest('websites');
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

    // Ideas
    async getIdeas() {
        if (this.USE_API) {
            try {
                return await this.apiRequest('ideas');
            } catch (error) {
                return JSON.parse(localStorage.getItem('auctus_ideas') || '[]');
            }
        }
        return JSON.parse(localStorage.getItem('auctus_ideas') || '[]');
    }

    async addIdea(idea) {
        if (this.USE_API) {
            try {
                return await this.apiRequest('ideas', 'POST', idea);
            } catch (error) {
                // Fallback
            }
        }
        const ideas = await this.getIdeas();
        idea.id = Date.now().toString();
        idea.createdAt = new Date().toISOString();
        ideas.push(idea);
        localStorage.setItem('auctus_ideas', JSON.stringify(ideas));
        return idea;
    }

    async updateIdea(id, updatedIdea) {
        if (this.USE_API) {
            try {
                return await this.apiRequest('ideas', 'PUT', { id, ...updatedIdea });
            } catch (error) {
                // Fallback
            }
        }
        const ideas = await this.getIdeas();
        const index = ideas.findIndex(i => i.id === id);
        if (index !== -1) {
            ideas[index] = { ...ideas[index], ...updatedIdea, updatedAt: new Date().toISOString() };
            localStorage.setItem('auctus_ideas', JSON.stringify(ideas));
        }
    }

    async deleteIdea(id) {
        if (this.USE_API) {
            try {
                return await this.apiRequest('ideas', 'DELETE', { id });
            } catch (error) {
                // Fallback
            }
        }
        const ideas = await this.getIdeas();
        const filtered = ideas.filter(i => i.id !== id);
        localStorage.setItem('auctus_ideas', JSON.stringify(filtered));
    }
}

// Initialize storage manager
window.storageManager = new StorageManager();
