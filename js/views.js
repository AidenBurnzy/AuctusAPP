// View Manager - Renders different views
class ViewManager {
    renderClientsView() {
        const clients = window.storageManager.getClients();
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

    renderProjectsView() {
        const projects = window.storageManager.getProjects();
        const clients = window.storageManager.getClients();
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

    renderWebsitesView() {
        const websites = window.storageManager.getWebsites();
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

    renderIdeasView() {
        const ideas = window.storageManager.getIdeas();
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
