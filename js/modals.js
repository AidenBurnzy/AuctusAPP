// Modal Manager - Handles all modals
class ModalManager {
    constructor() {
        this.container = document.getElementById('modal-container');
    }

    // SECURITY: Create elements safely using DOM APIs instead of innerHTML
    // This prevents XSS from stored data like client.name or project.description
    createElement(tag, className = '', textContent = '') {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (textContent) element.textContent = textContent; // textContent is safe - it doesn't parse HTML
        return element;
    }

    // SECURITY: Safely set form input values (no HTML parsing)
    setInputValue(input, value) {
        if (input.type === 'textarea' || input.tagName === 'TEXTAREA') {
            input.textContent = value || '';
        } else {
            input.value = value || '';
        }
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
        const client = clientId ? clients.find(c => c.id === clientId) : null;
        const isEdit = !!client;

        // SECURITY: Build modal using DOM APIs to prevent XSS from client.name, client.notes, etc.
        const overlay = this.createElement('div', 'modal-overlay');
        const modal = this.createElement('div', 'modal');
        const header = this.createElement('div', 'modal-header');
        const title = this.createElement('h3', '', isEdit ? 'Edit Client' : 'Add New Client');
        const closeBtn = this.createElement('button', 'close-btn');
        closeBtn.innerHTML = '<i class="fas fa-times"></i>'; // Icon is safe - it's controlled HTML
        
        const content = this.createElement('div', 'modal-content');
        const form = this.createElement('form', '');
        form.id = 'client-form';

        // Helper to create form group
        const createFormGroup = (label, inputElement) => {
            const group = this.createElement('div', 'form-group');
            const labelEl = this.createElement('label', '', label);
            group.appendChild(labelEl);
            group.appendChild(inputElement);
            return group;
        };

        // Name input
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.className = 'form-input';
        nameInput.name = 'name';
        nameInput.value = client?.name || '';
        nameInput.required = true;
        form.appendChild(createFormGroup('Client Name *', nameInput));

        // Email input
        const emailInput = document.createElement('input');
        emailInput.type = 'email';
        emailInput.className = 'form-input';
        emailInput.name = 'email';
        emailInput.value = client?.email || '';
        form.appendChild(createFormGroup('Email', emailInput));

        // Phone input
        const phoneInput = document.createElement('input');
        phoneInput.type = 'tel';
        phoneInput.className = 'form-input';
        phoneInput.name = 'phone';
        phoneInput.value = client?.phone || '';
        form.appendChild(createFormGroup('Phone', phoneInput));

        // Company input
        const companyInput = document.createElement('input');
        companyInput.type = 'text';
        companyInput.className = 'form-input';
        companyInput.name = 'company';
        companyInput.value = client?.company || '';
        form.appendChild(createFormGroup('Company', companyInput));

        // Type select
        const typeSelect = document.createElement('select');
        typeSelect.className = 'form-select';
        typeSelect.name = 'type';
        typeSelect.required = true;
        const typeOption1 = document.createElement('option');
        typeOption1.value = 'current';
        typeOption1.textContent = 'Current Client';
        typeOption1.selected = client?.type === 'current';
        const typeOption2 = document.createElement('option');
        typeOption2.value = 'potential';
        typeOption2.textContent = 'Potential Client';
        typeOption2.selected = client?.type === 'potential';
        typeSelect.appendChild(typeOption1);
        typeSelect.appendChild(typeOption2);
        form.appendChild(createFormGroup('Client Type *', typeSelect));

        // Notes textarea
        const notesTextarea = document.createElement('textarea');
        notesTextarea.className = 'form-textarea';
        notesTextarea.name = 'notes';
        notesTextarea.textContent = client?.notes || ''; // Use textContent for safe value
        form.appendChild(createFormGroup('Notes', notesTextarea));

        // Delete button (if editing)
        if (isEdit) {
            const deleteBtn = this.createElement('button', 'btn-primary btn-danger');
            deleteBtn.style.marginBottom = '1rem';
            deleteBtn.type = 'button';
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i> Delete Client';
            deleteBtn.addEventListener('click', () => this.deleteClient(clientId));
            form.appendChild(deleteBtn);
        }

        // Submit button
        const submitBtn = this.createElement('button', 'btn-primary');
        submitBtn.type = 'submit';
        submitBtn.textContent = isEdit ? 'Update Client' : 'Add Client';
        form.appendChild(submitBtn);

        // Assemble modal
        header.appendChild(title);
        header.appendChild(closeBtn);
        content.appendChild(form);
        modal.appendChild(header);
        modal.appendChild(content);
        overlay.appendChild(modal);

        // Clear container and add modal
        this.container.innerHTML = '';
        this.container.appendChild(overlay);

        // Event listeners (no inline handlers - all safe)
        closeBtn.addEventListener('click', () => this.closeModal());
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) this.closeModal();
        });

        form.addEventListener('submit', async (e) => {
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

        // SECURITY: Build modal using DOM APIs to prevent XSS from project.name, project.description, etc.
        const overlay = this.createElement('div', 'modal-overlay');
        const modal = this.createElement('div', 'modal');
        const header = this.createElement('div', 'modal-header');
        const title = this.createElement('h3', '', isEdit ? 'Edit Project' : 'New Project');
        const closeBtn = this.createElement('button', 'close-btn');
        closeBtn.innerHTML = '<i class="fas fa-times"></i>';
        
        const content = this.createElement('div', 'modal-content');
        const form = this.createElement('form', '');
        form.id = 'project-form';

        const createFormGroup = (label, inputElement) => {
            const group = this.createElement('div', 'form-group');
            const labelEl = this.createElement('label', '', label);
            group.appendChild(labelEl);
            group.appendChild(inputElement);
            return group;
        };

        // Project name
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.className = 'form-input';
        nameInput.name = 'name';
        nameInput.value = project?.name || '';
        nameInput.required = true;
        form.appendChild(createFormGroup('Project Name *', nameInput));

        // Client select
        const clientSelect = document.createElement('select');
        clientSelect.className = 'form-select';
        clientSelect.name = 'clientId';
        const clientOption0 = document.createElement('option');
        clientOption0.value = '';
        clientOption0.textContent = 'Select a client';
        clientSelect.appendChild(clientOption0);
        clients.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = c.name;
            opt.selected = project?.clientId === c.id;
            clientSelect.appendChild(opt);
        });
        form.appendChild(createFormGroup('Client', clientSelect));

        // Status select
        const statusSelect = document.createElement('select');
        statusSelect.className = 'form-select';
        statusSelect.name = 'status';
        statusSelect.required = true;
        ['active', 'paused', 'completed'].forEach(status => {
            const opt = document.createElement('option');
            opt.value = status;
            opt.textContent = status.charAt(0).toUpperCase() + status.slice(1);
            opt.selected = project?.status === status;
            statusSelect.appendChild(opt);
        });
        form.appendChild(createFormGroup('Status *', statusSelect));

        // Progress
        const progressInput = document.createElement('input');
        progressInput.type = 'number';
        progressInput.className = 'form-input';
        progressInput.name = 'progress';
        progressInput.min = '0';
        progressInput.max = '100';
        progressInput.value = project?.progress || 0;
        form.appendChild(createFormGroup('Progress (%)', progressInput));

        // Start date
        const startDateInput = document.createElement('input');
        startDateInput.type = 'date';
        startDateInput.className = 'form-input';
        startDateInput.name = 'startDate';
        startDateInput.value = project?.startDate || '';
        form.appendChild(createFormGroup('Start Date', startDateInput));

        // Description
        const descriptionTextarea = document.createElement('textarea');
        descriptionTextarea.className = 'form-textarea';
        descriptionTextarea.name = 'description';
        descriptionTextarea.textContent = project?.description || '';
        form.appendChild(createFormGroup('Description', descriptionTextarea));

        // Delete button (if editing)
        if (isEdit) {
            const deleteBtn = this.createElement('button', 'btn-primary btn-danger');
            deleteBtn.style.marginBottom = '1rem';
            deleteBtn.type = 'button';
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i> Delete Project';
            deleteBtn.addEventListener('click', () => this.deleteProject(projectId));
            form.appendChild(deleteBtn);
        }

        // Submit button
        const submitBtn = this.createElement('button', 'btn-primary');
        submitBtn.type = 'submit';
        submitBtn.textContent = isEdit ? 'Update Project' : 'Create Project';
        form.appendChild(submitBtn);

        // Assemble modal
        header.appendChild(title);
        header.appendChild(closeBtn);
        content.appendChild(form);
        modal.appendChild(header);
        modal.appendChild(content);
        overlay.appendChild(modal);

        // Clear container and add modal
        this.container.innerHTML = '';
        this.container.appendChild(overlay);

        // Event listeners
        closeBtn.addEventListener('click', () => this.closeModal());
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) this.closeModal();
        });

        form.addEventListener('submit', async (e) => {
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
        const website = websiteId ? websites.find(w => w.id === websiteId) : null;
        const isEdit = !!website;

        // SECURITY: Build modal using DOM APIs to prevent XSS
        const overlay = this.createElement('div', 'modal-overlay');
        const modal = this.createElement('div', 'modal');
        const header = this.createElement('div', 'modal-header');
        const title = this.createElement('h3', '', isEdit ? 'Edit Website' : 'Add Website');
        const closeBtn = this.createElement('button', 'close-btn');
        closeBtn.innerHTML = '<i class="fas fa-times"></i>';
        
        const content = this.createElement('div', 'modal-content');
        const form = this.createElement('form', '');
        form.id = 'website-form';

        const createFormGroup = (label, inputElement) => {
            const group = this.createElement('div', 'form-group');
            const labelEl = this.createElement('label', '', label);
            group.appendChild(labelEl);
            group.appendChild(inputElement);
            return group;
        };

        // Website name
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.className = 'form-input';
        nameInput.name = 'name';
        nameInput.value = website?.name || '';
        nameInput.required = true;
        form.appendChild(createFormGroup('Website Name *', nameInput));

        // URL
        const urlInput = document.createElement('input');
        urlInput.type = 'url';
        urlInput.className = 'form-input';
        urlInput.name = 'url';
        urlInput.placeholder = 'https://example.com';
        urlInput.value = website?.url || '';
        form.appendChild(createFormGroup('URL', urlInput));

        // Status
        const statusSelect = document.createElement('select');
        statusSelect.className = 'form-select';
        statusSelect.name = 'status';
        statusSelect.required = true;
        ['live', 'development', 'maintenance'].forEach(status => {
            const opt = document.createElement('option');
            opt.value = status;
            opt.textContent = status.charAt(0).toUpperCase() + status.slice(1);
            opt.selected = website?.status === status;
            statusSelect.appendChild(opt);
        });
        form.appendChild(createFormGroup('Status *', statusSelect));

        // Description
        const descriptionTextarea = document.createElement('textarea');
        descriptionTextarea.className = 'form-textarea';
        descriptionTextarea.name = 'description';
        descriptionTextarea.textContent = website?.description || '';
        form.appendChild(createFormGroup('Description', descriptionTextarea));

        // Technologies
        const technologiesInput = document.createElement('input');
        technologiesInput.type = 'text';
        technologiesInput.className = 'form-input';
        technologiesInput.name = 'technologies';
        technologiesInput.placeholder = 'e.g., React, Node.js, MongoDB';
        technologiesInput.value = website?.technologies || '';
        form.appendChild(createFormGroup('Technologies Used', technologiesInput));

        // Delete button (if editing)
        if (isEdit) {
            const deleteBtn = this.createElement('button', 'btn-primary btn-danger');
            deleteBtn.style.marginBottom = '1rem';
            deleteBtn.type = 'button';
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i> Delete Website';
            deleteBtn.addEventListener('click', () => this.deleteWebsite(websiteId));
            form.appendChild(deleteBtn);
        }

        // Submit button
        const submitBtn = this.createElement('button', 'btn-primary');
        submitBtn.type = 'submit';
        submitBtn.textContent = isEdit ? 'Update Website' : 'Add Website';
        form.appendChild(submitBtn);

        // Assemble modal
        header.appendChild(title);
        header.appendChild(closeBtn);
        content.appendChild(form);
        modal.appendChild(header);
        modal.appendChild(content);
        overlay.appendChild(modal);

        // Clear container and add modal
        this.container.innerHTML = '';
        this.container.appendChild(overlay);

        // Event listeners
        closeBtn.addEventListener('click', () => this.closeModal());
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) this.closeModal();
        });

        form.addEventListener('submit', async (e) => {
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
        const idea = ideaId ? ideas.find(i => i.id === ideaId) : null;
        const isEdit = !!idea;

        // SECURITY: Build modal using DOM APIs to prevent XSS
        const overlay = this.createElement('div', 'modal-overlay');
        const modal = this.createElement('div', 'modal');
        const header = this.createElement('div', 'modal-header');
        const title = this.createElement('h3', '', isEdit ? 'Edit Idea' : 'New Idea');
        const closeBtn = this.createElement('button', 'close-btn');
        closeBtn.innerHTML = '<i class="fas fa-times"></i>';
        
        const content = this.createElement('div', 'modal-content');
        const form = this.createElement('form', '');
        form.id = 'idea-form';

        const createFormGroup = (label, inputElement) => {
            const group = this.createElement('div', 'form-group');
            const labelEl = this.createElement('label', '', label);
            group.appendChild(labelEl);
            group.appendChild(inputElement);
            return group;
        };

        // Title
        const titleInput = document.createElement('input');
        titleInput.type = 'text';
        titleInput.className = 'form-input';
        titleInput.name = 'title';
        titleInput.value = idea?.title || '';
        titleInput.required = true;
        form.appendChild(createFormGroup('Title *', titleInput));

        // Category
        const categorySelect = document.createElement('select');
        categorySelect.className = 'form-select';
        categorySelect.name = 'category';
        const categories = [
            { value: '', label: 'Select category' },
            { value: 'feature', label: 'Feature Idea' },
            { value: 'project', label: 'New Project' },
            { value: 'improvement', label: 'Improvement' },
            { value: 'client', label: 'Client Related' },
            { value: 'other', label: 'Other' }
        ];
        categories.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat.value;
            opt.textContent = cat.label;
            opt.selected = idea?.category === cat.value;
            categorySelect.appendChild(opt);
        });
        form.appendChild(createFormGroup('Category', categorySelect));

        // Priority
        const prioritySelect = document.createElement('select');
        prioritySelect.className = 'form-select';
        prioritySelect.name = 'priority';
        ['low', 'medium', 'high'].forEach(priority => {
            const opt = document.createElement('option');
            opt.value = priority;
            opt.textContent = priority.charAt(0).toUpperCase() + priority.slice(1);
            opt.selected = idea?.priority === priority;
            prioritySelect.appendChild(opt);
        });
        form.appendChild(createFormGroup('Priority', prioritySelect));

        // Content
        const contentTextarea = document.createElement('textarea');
        contentTextarea.className = 'form-textarea';
        contentTextarea.name = 'content';
        contentTextarea.style.minHeight = '150px';
        contentTextarea.textContent = idea?.content || '';
        contentTextarea.required = true;
        form.appendChild(createFormGroup('Content *', contentTextarea));

        // Delete button (if editing)
        if (isEdit) {
            const deleteBtn = this.createElement('button', 'btn-primary btn-danger');
            deleteBtn.style.marginBottom = '1rem';
            deleteBtn.type = 'button';
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i> Delete Idea';
            deleteBtn.addEventListener('click', () => this.deleteIdea(ideaId));
            form.appendChild(deleteBtn);
        }

        // Submit button
        const submitBtn = this.createElement('button', 'btn-primary');
        submitBtn.type = 'submit';
        submitBtn.textContent = isEdit ? 'Update Idea' : 'Save Idea';
        form.appendChild(submitBtn);

        // Assemble modal
        header.appendChild(title);
        header.appendChild(closeBtn);
        content.appendChild(form);
        modal.appendChild(header);
        modal.appendChild(content);
        overlay.appendChild(modal);

        // Clear container and add modal
        this.container.innerHTML = '';
        this.container.appendChild(overlay);

        // Event listeners
        closeBtn.addEventListener('click', () => this.closeModal());
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) this.closeModal();
        });

        form.addEventListener('submit', async (e) => {
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

        // SECURITY: Build modal using DOM APIs to prevent XSS
        const overlay = this.createElement('div', 'modal-overlay');
        const modal = this.createElement('div', 'modal');
        const header = this.createElement('div', 'modal-header');
        const title = this.createElement('h3', '', isEdit ? 'Edit Transaction' : 'Add Transaction');
        const closeBtn = this.createElement('button', 'close-btn');
        closeBtn.innerHTML = '<i class="fas fa-times"></i>';
        
        const content = this.createElement('div', 'modal-content');
        const form = this.createElement('form', '');
        form.id = 'finance-form';

        const createFormGroup = (label, inputElement) => {
            const group = this.createElement('div', 'form-group');
            const labelEl = this.createElement('label', '', label);
            group.appendChild(labelEl);
            group.appendChild(inputElement);
            return group;
        };

        // Type
        const typeSelect = document.createElement('select');
        typeSelect.className = 'form-select';
        typeSelect.name = 'type';
        typeSelect.required = true;
        ['income', 'expense'].forEach(type => {
            const opt = document.createElement('option');
            opt.value = type;
            opt.textContent = type.charAt(0).toUpperCase() + type.slice(1);
            opt.selected = (finance?.type === type) || (!isEdit && defaultType === type);
            typeSelect.appendChild(opt);
        });
        form.appendChild(createFormGroup('Type *', typeSelect));

        // Category
        const categoryInput = document.createElement('input');
        categoryInput.type = 'text';
        categoryInput.className = 'form-input';
        categoryInput.name = 'category';
        categoryInput.placeholder = 'e.g., Website Design, Office Supplies';
        categoryInput.value = finance?.category || '';
        categoryInput.required = true;
        form.appendChild(createFormGroup('Category *', categoryInput));

        // Amount
        const amountInput = document.createElement('input');
        amountInput.type = 'number';
        amountInput.className = 'form-input';
        amountInput.name = 'amount';
        amountInput.value = finance?.amount || '';
        amountInput.step = '0.01';
        amountInput.min = '0';
        amountInput.placeholder = '0.00';
        amountInput.required = true;
        form.appendChild(createFormGroup('Amount *', amountInput));

        // Description
        const descriptionTextarea = document.createElement('textarea');
        descriptionTextarea.className = 'form-textarea';
        descriptionTextarea.name = 'description';
        descriptionTextarea.rows = 3;
        descriptionTextarea.placeholder = 'Optional notes about this transaction';
        descriptionTextarea.textContent = finance?.description || '';
        form.appendChild(createFormGroup('Description', descriptionTextarea));

        // Client
        const clientSelect = document.createElement('select');
        clientSelect.className = 'form-select';
        clientSelect.name = 'client_id';
        const clientOpt0 = document.createElement('option');
        clientOpt0.value = '';
        clientOpt0.textContent = 'None';
        clientSelect.appendChild(clientOpt0);
        clients.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = c.name;
            opt.selected = finance?.client_id == c.id;
            clientSelect.appendChild(opt);
        });
        form.appendChild(createFormGroup('Client (Optional)', clientSelect));

        // Project
        const projectSelect = document.createElement('select');
        projectSelect.className = 'form-select';
        projectSelect.name = 'project_id';
        const projectOpt0 = document.createElement('option');
        projectOpt0.value = '';
        projectOpt0.textContent = 'None';
        projectSelect.appendChild(projectOpt0);
        projects.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.textContent = p.name;
            opt.selected = finance?.project_id == p.id;
            projectSelect.appendChild(opt);
        });
        form.appendChild(createFormGroup('Project (Optional)', projectSelect));

        // Transaction date
        const dateInput = document.createElement('input');
        dateInput.type = 'date';
        dateInput.className = 'form-input';
        dateInput.name = 'transaction_date';
        dateInput.value = finance?.transaction_date || today;
        dateInput.required = true;
        form.appendChild(createFormGroup('Transaction Date *', dateInput));

        // Payment method
        const paymentSelect = document.createElement('select');
        paymentSelect.className = 'form-select';
        paymentSelect.name = 'payment_method';
        const paymentMethods = [
            { value: '', label: 'Select method' },
            { value: 'cash', label: 'Cash' },
            { value: 'check', label: 'Check' },
            { value: 'card', label: 'Credit/Debit Card' },
            { value: 'transfer', label: 'Bank Transfer' },
            { value: 'paypal', label: 'PayPal' },
            { value: 'other', label: 'Other' }
        ];
        paymentMethods.forEach(method => {
            const opt = document.createElement('option');
            opt.value = method.value;
            opt.textContent = method.label;
            opt.selected = finance?.payment_method === method.value;
            paymentSelect.appendChild(opt);
        });
        form.appendChild(createFormGroup('Payment Method', paymentSelect));

        // Status
        const statusSelect = document.createElement('select');
        statusSelect.className = 'form-select';
        statusSelect.name = 'status';
        statusSelect.required = true;
        ['completed', 'pending'].forEach(status => {
            const opt = document.createElement('option');
            opt.value = status;
            opt.textContent = status.charAt(0).toUpperCase() + status.slice(1);
            opt.selected = finance?.status === status || (!isEdit && status === 'completed');
            statusSelect.appendChild(opt);
        });
        form.appendChild(createFormGroup('Status *', statusSelect));

        // Form actions container
        const formActions = this.createElement('div', 'form-actions');
        
        // Delete button (if editing)
        if (isEdit) {
            const deleteBtn = this.createElement('button', 'btn btn-danger');
            deleteBtn.type = 'button';
            deleteBtn.textContent = 'Delete';
            deleteBtn.addEventListener('click', () => this.deleteFinance(finance.id));
            formActions.appendChild(deleteBtn);
        }

        // Submit button
        const submitBtn = this.createElement('button', 'btn btn-primary');
        submitBtn.type = 'submit';
        submitBtn.textContent = (isEdit ? 'Update' : 'Add') + ' Transaction';
        formActions.appendChild(submitBtn);

        form.appendChild(formActions);

        // Assemble modal
        header.appendChild(title);
        header.appendChild(closeBtn);
        content.appendChild(form);
        modal.appendChild(header);
        modal.appendChild(content);
        overlay.appendChild(modal);

        // Clear container and add modal
        this.container.innerHTML = '';
        this.container.appendChild(overlay);

        // Event listeners
        closeBtn.addEventListener('click', () => this.closeModal());
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) this.closeModal();
        });

        form.addEventListener('submit', async (e) => {
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

    // Recurring Income Modal
    async openRecurringIncomeModal(incomeId = null) {
        const incomes = await window.storageManager.getRecurringIncome();
        const clients = await window.storageManager.getClients();
        const income = incomeId ? incomes.find(i => i.id == incomeId) : null;
        const isEdit = !!income;

        // SECURITY: Build modal using DOM APIs to prevent XSS
        const overlay = this.createElement('div', 'modal-overlay');
        const modal = this.createElement('div', 'modal');
        const header = this.createElement('div', 'modal-header');
        const title = this.createElement('h3', '', (isEdit ? 'Edit' : 'Add') + ' Recurring Income');
        const closeBtn = this.createElement('button', 'close-btn');
        closeBtn.innerHTML = '<i class="fas fa-times"></i>';
        
        const content = this.createElement('div', 'modal-content');
        const form = this.createElement('form', '');
        form.id = 'income-form';

        const createFormGroup = (label, inputElement) => {
            const group = this.createElement('div', 'form-group');
            const labelEl = this.createElement('label', '', label);
            group.appendChild(labelEl);
            group.appendChild(inputElement);
            return group;
        };

        // Client select
        const clientSelect = document.createElement('select');
        clientSelect.className = 'form-select';
        clientSelect.name = 'client_id';
        const clientOpt0 = document.createElement('option');
        clientOpt0.value = '';
        clientOpt0.textContent = 'Select or type new client';
        clientSelect.appendChild(clientOpt0);
        clients.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = c.name;
            opt.selected = income?.client_id == c.id;
            clientSelect.appendChild(opt);
        });
        form.appendChild(createFormGroup('Client *', clientSelect));

        // Client name
        const clientNameInput = document.createElement('input');
        clientNameInput.type = 'text';
        clientNameInput.className = 'form-input';
        clientNameInput.name = 'client_name';
        clientNameInput.value = income?.client_name || '';
        clientNameInput.required = true;
        form.appendChild(createFormGroup('Client Name * (or select above)', clientNameInput));

        // Monthly payment
        const paymentInput = document.createElement('input');
        paymentInput.type = 'number';
        paymentInput.className = 'form-input';
        paymentInput.name = 'monthly_payment';
        paymentInput.value = income?.monthly_payment || '';
        paymentInput.step = '0.01';
        paymentInput.min = '0';
        paymentInput.placeholder = '0.00';
        paymentInput.required = true;
        form.appendChild(createFormGroup('Monthly Payment *', paymentInput));

        // Active checkbox
        const checkboxGroup = this.createElement('div', 'form-group');
        const checkboxLabel = this.createElement('label', '');
        checkboxLabel.style.display = 'flex';
        checkboxLabel.style.alignItems = 'center';
        checkboxLabel.style.gap = '0.5rem';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.name = 'is_active';
        checkbox.checked = income?.is_active !== false;
        const checkboxText = this.createElement('span', '', 'Active');
        checkboxLabel.appendChild(checkbox);
        checkboxLabel.appendChild(checkboxText);
        checkboxGroup.appendChild(checkboxLabel);
        form.appendChild(checkboxGroup);

        // Form actions
        const formActions = this.createElement('div', 'form-actions');
        
        // Delete button (if editing)
        if (isEdit) {
            const deleteBtn = this.createElement('button', 'btn btn-danger');
            deleteBtn.type = 'button';
            deleteBtn.textContent = 'Delete';
            deleteBtn.addEventListener('click', () => this.deleteRecurringIncome(income.id));
            formActions.appendChild(deleteBtn);
        }

        // Submit button
        const submitBtn = this.createElement('button', 'btn btn-primary');
        submitBtn.type = 'submit';
        submitBtn.textContent = isEdit ? 'Update' : 'Add';
        formActions.appendChild(submitBtn);

        form.appendChild(formActions);

        // Assemble modal
        header.appendChild(title);
        header.appendChild(closeBtn);
        content.appendChild(form);
        modal.appendChild(header);
        modal.appendChild(content);
        overlay.appendChild(modal);

        // Clear container and add modal
        this.container.innerHTML = '';
        this.container.appendChild(overlay);

        // Event listeners
        closeBtn.addEventListener('click', () => this.closeModal());
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) this.closeModal();
        });

        // Auto-fill client name when client is selected
        clientSelect.addEventListener('change', () => {
            const selectedClient = clients.find(c => c.id == clientSelect.value);
            if (selectedClient) {
                clientNameInput.value = selectedClient.name;
            }
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const incomeData = {
                client_id: formData.get('client_id') || null,
                client_name: formData.get('client_name'),
                monthly_payment: parseFloat(formData.get('monthly_payment')),
                is_active: formData.get('is_active') === 'on'
            };

            if (isEdit) {
                await window.storageManager.updateRecurringIncome(income.id, incomeData);
            } else {
                await window.storageManager.addRecurringIncome(incomeData);
            }
            await this.closeModal();
        });
    }

    async deleteRecurringIncome(id) {
        if (confirm('Are you sure you want to delete this recurring income?')) {
            await window.storageManager.deleteRecurringIncome(id);
            await this.closeModal();
        }
    }

    // Subscription Modal
    async openSubscriptionModal(subId = null) {
        const subscriptions = await window.storageManager.getSubscriptions();
        const subscription = subId ? subscriptions.find(s => s.id == subId) : null;
        const isEdit = !!subscription;

        // SECURITY: Build modal using DOM APIs to prevent XSS
        const overlay = this.createElement('div', 'modal-overlay');
        const modal = this.createElement('div', 'modal');
        const header = this.createElement('div', 'modal-header');
        const title = this.createElement('h3', '', (isEdit ? 'Edit' : 'Add') + ' Subscription');
        const closeBtn = this.createElement('button', 'close-btn');
        closeBtn.innerHTML = '<i class="fas fa-times"></i>';
        
        const content = this.createElement('div', 'modal-content');
        const form = this.createElement('form', '');
        form.id = 'subscription-form';

        const createFormGroup = (label, inputElement) => {
            const group = this.createElement('div', 'form-group');
            const labelEl = this.createElement('label', '', label);
            group.appendChild(labelEl);
            group.appendChild(inputElement);
            return group;
        };

        // Name
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.className = 'form-input';
        nameInput.name = 'name';
        nameInput.value = subscription?.name || '';
        nameInput.placeholder = 'e.g., Claude, Neon, Github';
        nameInput.required = true;
        form.appendChild(createFormGroup('Subscription Name *', nameInput));

        // Monthly cost
        const costInput = document.createElement('input');
        costInput.type = 'number';
        costInput.className = 'form-input';
        costInput.name = 'monthly_cost';
        costInput.value = subscription?.monthly_cost || '';
        costInput.step = '0.01';
        costInput.min = '0';
        costInput.placeholder = '0.00';
        costInput.required = true;
        form.appendChild(createFormGroup('Monthly Cost *', costInput));

        // Description
        const descriptionTextarea = document.createElement('textarea');
        descriptionTextarea.className = 'form-textarea';
        descriptionTextarea.name = 'description';
        descriptionTextarea.rows = 2;
        descriptionTextarea.placeholder = 'Optional notes';
        descriptionTextarea.textContent = subscription?.description || '';
        form.appendChild(createFormGroup('Description', descriptionTextarea));

        // Active checkbox
        const checkboxGroup = this.createElement('div', 'form-group');
        const checkboxLabel = this.createElement('label', '');
        checkboxLabel.style.display = 'flex';
        checkboxLabel.style.alignItems = 'center';
        checkboxLabel.style.gap = '0.5rem';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.name = 'is_active';
        checkbox.checked = subscription?.is_active !== false;
        const checkboxText = this.createElement('span', '', 'Active');
        checkboxLabel.appendChild(checkbox);
        checkboxLabel.appendChild(checkboxText);
        checkboxGroup.appendChild(checkboxLabel);
        form.appendChild(checkboxGroup);

        // Form actions
        const formActions = this.createElement('div', 'form-actions');
        
        // Delete button (if editing)
        if (isEdit) {
            const deleteBtn = this.createElement('button', 'btn btn-danger');
            deleteBtn.type = 'button';
            deleteBtn.textContent = 'Delete';
            deleteBtn.addEventListener('click', () => this.deleteSubscription(subscription.id));
            formActions.appendChild(deleteBtn);
        }

        // Submit button
        const submitBtn = this.createElement('button', 'btn btn-primary');
        submitBtn.type = 'submit';
        submitBtn.textContent = isEdit ? 'Update' : 'Add';
        formActions.appendChild(submitBtn);

        form.appendChild(formActions);

        // Assemble modal
        header.appendChild(title);
        header.appendChild(closeBtn);
        content.appendChild(form);
        modal.appendChild(header);
        modal.appendChild(content);
        overlay.appendChild(modal);

        // Clear container and add modal
        this.container.innerHTML = '';
        this.container.appendChild(overlay);

        // Event listeners
        closeBtn.addEventListener('click', () => this.closeModal());
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) this.closeModal();
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const subscriptionData = {
                name: formData.get('name'),
                monthly_cost: parseFloat(formData.get('monthly_cost')),
                description: formData.get('description'),
                is_active: formData.get('is_active') === 'on'
            };

            if (isEdit) {
                await window.storageManager.updateSubscription(subscription.id, subscriptionData);
            } else {
                await window.storageManager.addSubscription(subscriptionData);
            }
            await this.closeModal();
        });
    }

    async deleteSubscription(id) {
        if (confirm('Are you sure you want to delete this subscription?')) {
            await window.storageManager.deleteSubscription(id);
            await this.closeModal();
        }
    }

    // Budget Allocation Modal
    async openAllocationModal(allocId = null) {
        const allocations = await window.storageManager.getAllocations();
        const allocation = allocId ? allocations.find(a => a.id == allocId) : null;
        const isEdit = !!allocation;

        // SECURITY: Build modal using DOM APIs to prevent XSS
        const overlay = this.createElement('div', 'modal-overlay');
        const modal = this.createElement('div', 'modal');
        const header = this.createElement('div', 'modal-header');
        const title = this.createElement('h3', '', (isEdit ? 'Edit' : 'Add') + ' Budget Allocation');
        const closeBtn = this.createElement('button', 'close-btn');
        closeBtn.innerHTML = '<i class="fas fa-times"></i>';
        
        const content = this.createElement('div', 'modal-content');
        const form = this.createElement('form', '');
        form.id = 'allocation-form';

        const createFormGroup = (label, inputElement) => {
            const group = this.createElement('div', 'form-group');
            const labelEl = this.createElement('label', '', label);
            group.appendChild(labelEl);
            group.appendChild(inputElement);
            return group;
        };

        // Category
        const categoryInput = document.createElement('input');
        categoryInput.type = 'text';
        categoryInput.className = 'form-input';
        categoryInput.name = 'category';
        categoryInput.value = allocation?.category || '';
        categoryInput.placeholder = 'e.g., To Savings, To Checking, To Employees';
        categoryInput.required = true;
        form.appendChild(createFormGroup('Allocation Category *', categoryInput));

        // Percentage
        const percentageInput = document.createElement('input');
        percentageInput.type = 'number';
        percentageInput.className = 'form-input';
        percentageInput.name = 'percentage';
        percentageInput.value = allocation?.percentage || '';
        percentageInput.step = '1';
        percentageInput.min = '0';
        percentageInput.max = '100';
        percentageInput.placeholder = '35';
        percentageInput.required = true;
        form.appendChild(createFormGroup('Percentage *', percentageInput));

        // Description
        const descriptionTextarea = document.createElement('textarea');
        descriptionTextarea.className = 'form-textarea';
        descriptionTextarea.name = 'description';
        descriptionTextarea.rows = 2;
        descriptionTextarea.placeholder = 'Optional notes';
        descriptionTextarea.textContent = allocation?.description || '';
        form.appendChild(createFormGroup('Description', descriptionTextarea));

        // Form actions
        const formActions = this.createElement('div', 'form-actions');
        
        // Delete button (if editing)
        if (isEdit) {
            const deleteBtn = this.createElement('button', 'btn btn-danger');
            deleteBtn.type = 'button';
            deleteBtn.textContent = 'Delete';
            deleteBtn.addEventListener('click', () => this.deleteAllocation(allocation.id));
            formActions.appendChild(deleteBtn);
        }

        // Submit button
        const submitBtn = this.createElement('button', 'btn btn-primary');
        submitBtn.type = 'submit';
        submitBtn.textContent = isEdit ? 'Update' : 'Add';
        formActions.appendChild(submitBtn);

        form.appendChild(formActions);

        // Assemble modal
        header.appendChild(title);
        header.appendChild(closeBtn);
        content.appendChild(form);
        modal.appendChild(header);
        modal.appendChild(content);
        overlay.appendChild(modal);

        // Clear container and add modal
        this.container.innerHTML = '';
        this.container.appendChild(overlay);

        // Event listeners
        closeBtn.addEventListener('click', () => this.closeModal());
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) this.closeModal();
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const allocationData = {
                category: formData.get('category'),
                percentage: parseFloat(formData.get('percentage')),
                description: formData.get('description')
            };

            if (isEdit) {
                await window.storageManager.updateAllocation(allocation.id, allocationData);
            } else {
                await window.storageManager.addAllocation(allocationData);
            }
            await this.closeModal();
        });
    }

    async deleteAllocation(id) {
        if (confirm('Are you sure you want to delete this allocation?')) {
            await window.storageManager.deleteAllocation(id);
            await this.closeModal();
        }
    }

    // Employee Modal
    async openEmployeeModal(empId = null) {
        const employees = await window.storageManager.getEmployees();
        const employee = empId ? employees.find(e => e.id == empId) : null;
        const isEdit = !!employee;

        // SECURITY: Build modal using DOM APIs to prevent XSS
        const overlay = this.createElement('div', 'modal-overlay');
        const modal = this.createElement('div', 'modal');
        const header = this.createElement('div', 'modal-header');
        const title = this.createElement('h3', '', (isEdit ? 'Edit' : 'Add') + ' Employee');
        const closeBtn = this.createElement('button', 'close-btn');
        closeBtn.innerHTML = '<i class="fas fa-times"></i>';
        
        const content = this.createElement('div', 'modal-content');
        const form = this.createElement('form', '');
        form.id = 'employee-form';

        const createFormGroup = (label, inputElement) => {
            const group = this.createElement('div', 'form-group');
            const labelEl = this.createElement('label', '', label);
            group.appendChild(labelEl);
            group.appendChild(inputElement);
            return group;
        };

        // Info note
        const infoDiv = this.createElement('div');
        infoDiv.style.background = 'rgba(108, 99, 255, 0.1)';
        infoDiv.style.padding = '1rem';
        infoDiv.style.borderRadius = '8px';
        infoDiv.style.marginBottom = '1rem';
        infoDiv.style.fontSize = '0.875rem';
        infoDiv.style.color = 'var(--text-secondary)';
        infoDiv.innerHTML = '<i class="fas fa-info-circle"></i> <strong>Note:</strong> Employee percentages are calculated from the "To Employees" budget allocation pool, not from total net income.';
        form.appendChild(infoDiv);

        // Name
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.className = 'form-input';
        nameInput.name = 'name';
        nameInput.value = employee?.name || '';
        nameInput.placeholder = 'e.g., Aiden, Nick';
        nameInput.required = true;
        form.appendChild(createFormGroup('Employee Name *', nameInput));

        // Percentage
        const percentageInput = document.createElement('input');
        percentageInput.type = 'number';
        percentageInput.className = 'form-input';
        percentageInput.name = 'percentage';
        percentageInput.value = employee?.percentage || '';
        percentageInput.step = '1';
        percentageInput.min = '0';
        percentageInput.max = '100';
        percentageInput.placeholder = '60';
        percentageInput.required = true;
        const percentageGroup = createFormGroup('Income Percentage * (% of Employee Pool)', percentageInput);
        const smallText = document.createElement('small');
        smallText.style.color = 'var(--text-secondary)';
        smallText.style.fontSize = '0.8rem';
        smallText.textContent = 'This is the percentage of the employee allocation pool, not net income.';
        percentageGroup.appendChild(smallText);
        form.appendChild(percentageGroup);

        // Active checkbox
        const checkboxGroup = this.createElement('div', 'form-group');
        const checkboxLabel = this.createElement('label', '');
        checkboxLabel.style.display = 'flex';
        checkboxLabel.style.alignItems = 'center';
        checkboxLabel.style.gap = '0.5rem';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.name = 'is_active';
        checkbox.checked = employee?.is_active !== false;
        const checkboxText = this.createElement('span', '', 'Active');
        checkboxLabel.appendChild(checkbox);
        checkboxLabel.appendChild(checkboxText);
        checkboxGroup.appendChild(checkboxLabel);
        form.appendChild(checkboxGroup);

        // Form actions
        const formActions = this.createElement('div', 'form-actions');
        
        // Delete button (if editing)
        if (isEdit) {
            const deleteBtn = this.createElement('button', 'btn btn-danger');
            deleteBtn.type = 'button';
            deleteBtn.textContent = 'Delete';
            deleteBtn.addEventListener('click', () => this.deleteEmployee(employee.id));
            formActions.appendChild(deleteBtn);
        }

        // Submit button
        const submitBtn = this.createElement('button', 'btn btn-primary');
        submitBtn.type = 'submit';
        submitBtn.textContent = isEdit ? 'Update' : 'Add';
        formActions.appendChild(submitBtn);

        form.appendChild(formActions);

        // Assemble modal
        header.appendChild(title);
        header.appendChild(closeBtn);
        content.appendChild(form);
        modal.appendChild(header);
        modal.appendChild(content);
        overlay.appendChild(modal);

        // Clear container and add modal
        this.container.innerHTML = '';
        this.container.appendChild(overlay);

        // Event listeners
        closeBtn.addEventListener('click', () => this.closeModal());
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) this.closeModal();
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const employeeData = {
                name: formData.get('name'),
                percentage: parseFloat(formData.get('percentage')),
                is_active: formData.get('is_active') === 'on'
            };

            if (isEdit) {
                await window.storageManager.updateEmployee(employee.id, employeeData);
            } else {
                await window.storageManager.addEmployee(employeeData);
            }
            await this.closeModal();
        });
    }

    async deleteEmployee(id) {
        if (confirm('Are you sure you want to delete this employee?')) {
            await window.storageManager.deleteEmployee(id);
            await this.closeModal();
        }
    }

    async openNoteModal(noteId = null) {
        const notes = await window.storageManager.getNotes();
        const note = noteId ? notes.find(n => n.id == noteId) : null;
        const isEdit = !!note;
        const currentUser = localStorage.getItem('auctus_current_user');

        // Check if user profile is set
        if (!currentUser && !isEdit) {
            alert('Please set your user profile in Settings first!');
            window.app.showView('settings');
            return;
        }

        // SECURITY: Build modal using DOM APIs to prevent XSS
        const overlay = this.createElement('div', 'modal-overlay');
        const modal = this.createElement('div', 'modal');
        const header = this.createElement('div', 'modal-header');
        const title = this.createElement('h3', '', isEdit ? 'Edit Note' : 'Add New Note');
        const closeBtn = this.createElement('button', 'close-btn');
        closeBtn.innerHTML = '<i class="fas fa-times"></i>';
        
        const content = this.createElement('div', 'modal-content');
        const form = this.createElement('form', '');
        form.id = 'note-form';

        const createFormGroup = (label, inputElement) => {
            const group = this.createElement('div', 'form-group');
            const labelEl = this.createElement('label', '', label);
            group.appendChild(labelEl);
            group.appendChild(inputElement);
            return group;
        };

        // Title
        const titleInput = document.createElement('input');
        titleInput.type = 'text';
        titleInput.className = 'form-input';
        titleInput.name = 'title';
        titleInput.value = note?.title || '';
        titleInput.placeholder = 'Enter note title';
        titleInput.required = true;
        form.appendChild(createFormGroup('Title *', titleInput));

        // Content
        const contentTextarea = document.createElement('textarea');
        contentTextarea.className = 'form-input';
        contentTextarea.name = 'content';
        contentTextarea.rows = 4;
        contentTextarea.placeholder = 'Add more details...';
        contentTextarea.textContent = note?.content || '';
        form.appendChild(createFormGroup('Details', contentTextarea));

        // Priority
        const prioritySelect = document.createElement('select');
        prioritySelect.className = 'form-select';
        prioritySelect.name = 'priority';
        ['low', 'medium', 'high'].forEach(priority => {
            const opt = document.createElement('option');
            opt.value = priority;
            opt.textContent = priority.charAt(0).toUpperCase() + priority.slice(1);
            opt.selected = note?.priority === priority;
            prioritySelect.appendChild(opt);
        });
        form.appendChild(createFormGroup('Priority', prioritySelect));

        // Completed checkbox (if editing)
        if (isEdit) {
            const checkboxGroup = this.createElement('div', 'form-group');
            const checkboxLabel = this.createElement('label', 'checkbox-label');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.name = 'is_completed';
            checkbox.checked = note.is_completed;
            const checkboxText = this.createElement('span', '', 'Mark as completed');
            checkboxLabel.appendChild(checkbox);
            checkboxLabel.appendChild(checkboxText);
            checkboxGroup.appendChild(checkboxLabel);
            form.appendChild(checkboxGroup);
        }

        // Form actions
        const formActions = this.createElement('div', 'form-actions');
        
        // Delete button (if editing)
        if (isEdit) {
            const deleteBtn = this.createElement('button', 'btn-delete');
            deleteBtn.type = 'button';
            deleteBtn.textContent = 'Delete';
            deleteBtn.addEventListener('click', () => this.deleteNote(note.id));
            formActions.appendChild(deleteBtn);
        }

        // Cancel button
        const cancelBtn = this.createElement('button', 'btn-secondary');
        cancelBtn.type = 'button';
        cancelBtn.textContent = 'Cancel';
        cancelBtn.addEventListener('click', () => this.closeModal());
        formActions.appendChild(cancelBtn);

        // Submit button
        const submitBtn = this.createElement('button', 'btn-primary');
        submitBtn.type = 'submit';
        submitBtn.textContent = (isEdit ? 'Update' : 'Add') + ' Note';
        formActions.appendChild(submitBtn);

        form.appendChild(formActions);

        // Assemble modal
        header.appendChild(title);
        header.appendChild(closeBtn);
        content.appendChild(form);
        modal.appendChild(header);
        modal.appendChild(content);
        overlay.appendChild(modal);

        // Clear container and add modal
        this.container.innerHTML = '';
        this.container.appendChild(overlay);

        // Event listeners
        closeBtn.addEventListener('click', () => this.closeModal());
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) this.closeModal();
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const noteData = {
                title: formData.get('title'),
                content: formData.get('content'),
                priority: formData.get('priority'),
                created_by: isEdit ? note.created_by : currentUser,
                is_completed: formData.get('is_completed') === 'on'
            };

            if (isEdit) {
                await window.storageManager.updateNote(note.id, noteData);
            } else {
                await window.storageManager.addNote(noteData);
            }
            await this.closeModal();
            // Refresh notes view if we're on the notes page
            if (window.app.currentView === 'notes') {
                await window.app.showView('notes');
            }
        });
    }

    async deleteNote(id) {
        if (confirm('Are you sure you want to delete this note?')) {
            await window.storageManager.deleteNote(id);
            await this.closeModal();
            // Refresh notes view if we're on the notes page
            if (window.app.currentView === 'notes') {
                await window.app.showView('notes');
            }
        }
    }
}

// Initialize modal manager
window.modalManager = new ModalManager();
