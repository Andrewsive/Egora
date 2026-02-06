// ===================================
// Reminders Module - CRUD Operations & UI
// ===================================

class RemindersManager {
    constructor() {
        this.container = null;
        this.reminders = [];
        this.searchQuery = '';
        this.currentEditingId = null;
    }

    // Initialize reminders
    async init() {
        this.container = document.getElementById('remindersContent');

        // Load reminders from storage
        await this.loadReminders();

        // Render reminders
        this.render();

        // Set up event listeners
        this.setupEventListeners();
    }

    // Load reminders from storage
    async loadReminders() {
        try {
            this.reminders = await window.storageManager.getReminders();

            // If no reminders, create demo data
            if (this.reminders.length === 0) {
                await this.createDemoData();
                this.reminders = await window.storageManager.getReminders();
            }
        } catch (error) {
            console.error('Error loading reminders:', error);
            this.reminders = [];
        }
    }

    // Create demo data
    async createDemoData() {
        const now = Date.now();
        const demoReminders = [
            {
                id: 'reminder_1',
                title: 'Buy Milk',
                context: 'When I am at the supermarket',
                priority: 'medium',
                enabled: true,
                createdAt: now - 86400000,
                lastTriggered: now - 3600000
            },
            {
                id: 'reminder_2',
                title: 'Call Mom',
                context: 'When I am on my way home',
                priority: 'high',
                enabled: true,
                createdAt: now - 172800000,
                lastTriggered: null
            },
            {
                id: 'reminder_3',
                title: 'Drink Water and Rest',
                context: 'When I have been working at the office for more than 2 hours',
                priority: 'low',
                enabled: false,
                createdAt: now - 259200000,
                lastTriggered: null
            }
        ];

        for (const reminder of demoReminders) {
            await window.storageManager.addReminder(reminder);
        }
    }

    // Setup event listeners
    setupEventListeners() {
        // Add reminder button
        document.getElementById('addReminderBtn')?.addEventListener('click', () => {
            this.showReminderModal();
        });

        // Search input
        document.getElementById('searchReminders')?.addEventListener('input', (e) => {
            this.searchQuery = e.target.value.toLowerCase();
            this.render();
        });

        // Modal close buttons
        document.getElementById('closeModalBtn')?.addEventListener('click', () => {
            this.hideReminderModal();
        });

        document.getElementById('cancelModalBtn')?.addEventListener('click', () => {
            this.hideReminderModal();
        });

        // Modal overlay click
        document.querySelector('#reminderModal .modal-overlay')?.addEventListener('click', () => {
            this.hideReminderModal();
        });

        // Form submit
        document.getElementById('reminderForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveReminder();
        });
    }

    // Render reminders list
    render() {
        if (!this.container) return;

        // Filter reminders by search query
        let filtered = this.reminders;
        if (this.searchQuery) {
            filtered = this.reminders.filter(r =>
                r.title.toLowerCase().includes(this.searchQuery) ||
                r.context.toLowerCase().includes(this.searchQuery)
            );
        }

        if (filtered.length === 0) {
            this.renderEmpty();
            return;
        }

        // Sort by enabled status and created date
        filtered.sort((a, b) => {
            if (a.enabled !== b.enabled) return b.enabled - a.enabled;
            return b.createdAt - a.createdAt;
        });

        const html = filtered.map(reminder => this.renderReminder(reminder)).join('');
        this.container.innerHTML = html;

        // Add event listeners to cards
        this.attachReminderListeners();
    }

    // Render single reminder
    renderReminder(reminder) {
        const lastTriggered = reminder.lastTriggered
            ? `Last triggered: ${this.formatRelativeTime(reminder.lastTriggered)}`
            : 'Never triggered';

        return `
            <div class="reminder-card" data-reminder-id="${reminder.id}">
                <div class="reminder-header">
                    <div class="reminder-title">${this.escapeHtml(reminder.title)}</div>
                    <label class="reminder-toggle">
                        <input type="checkbox" ${reminder.enabled ? 'checked' : ''} data-action="toggle">
                        <span class="toggle-slider"></span>
                    </label>
                </div>
                <div class="reminder-context">${this.escapeHtml(reminder.context)}</div>
                <div class="reminder-footer">
                    <span class="priority-badge ${reminder.priority}">${this.getPriorityLabel(reminder.priority)}</span>
                    <span style="color: var(--color-text-muted); font-size: 0.875rem;">${lastTriggered}</span>
                </div>
                <div class="reminder-actions" style="margin-top: 1rem; display: flex; gap: 0.5rem;">
                    <button class="btn btn-small btn-secondary" data-action="edit">
                        <svg class="icon" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg> 
                        Edit
                    </button>
                    <button class="btn btn-small btn-secondary" data-action="delete" style="color: var(--color-danger);">
                        <svg class="icon" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg> 
                        Delete
                    </button>
                </div>
            </div>
        `;
    }

    // Render empty state
    renderEmpty() {
        const message = this.searchQuery
            ? `No reminders match "${this.searchQuery}"`
            : 'No reminders yet';

        this.container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔔</div>
                <div class="empty-text">${message}</div>
                <div class="empty-subtext">Click the "➕" button in the top right to create a new reminder</div>
            </div>
        `;
    }

    // Attach event listeners to reminder cards
    attachReminderListeners() {
        this.container.querySelectorAll('.reminder-card').forEach(card => {
            const id = card.dataset.reminderId;

            // Toggle switch
            const toggle = card.querySelector('[data-action="toggle"]');
            toggle?.addEventListener('change', (e) => {
                this.toggleReminder(id, e.target.checked);
            });

            // Edit button
            const editBtn = card.querySelector('[data-action="edit"]');
            editBtn?.addEventListener('click', () => {
                this.editReminder(id);
            });

            // Delete button
            const deleteBtn = card.querySelector('[data-action="delete"]');
            deleteBtn?.addEventListener('click', () => {
                this.deleteReminder(id);
            });
        });
    }

    // Show reminder modal (for create/edit)
    showReminderModal(reminder = null) {
        const modal = document.getElementById('reminderModal');
        const modalTitle = document.getElementById('modalTitle');
        const form = document.getElementById('reminderForm');

        if (reminder) {
            // Edit mode
            modalTitle.textContent = 'Edit Reminder';
            document.getElementById('reminderTitle').value = reminder.title;
            document.getElementById('reminderContext').value = reminder.context;
            document.getElementById('reminderPriority').value = reminder.priority;
            this.currentEditingId = reminder.id;
        } else {
            // Create mode
            modalTitle.textContent = 'Create Reminder';
            form.reset();
            this.currentEditingId = null;
        }

        // Set custom validation messages in English
        const titleInput = document.getElementById('reminderTitle');
        const contextInput = document.getElementById('reminderContext');

        titleInput.oninvalid = function (e) {
            e.target.setCustomValidity('Please fill in this field.');
        };
        titleInput.oninput = function (e) {
            e.target.setCustomValidity('');
        };

        contextInput.oninvalid = function (e) {
            e.target.setCustomValidity('Please fill in this field.');
        };
        contextInput.oninput = function (e) {
            e.target.setCustomValidity('');
        };

        modal.classList.add('active');
    }

    // Hide reminder modal
    hideReminderModal() {
        const modal = document.getElementById('reminderModal');
        modal.classList.remove('active');
        this.currentEditingId = null;
    }

    // Save reminder (create or update)
    async saveReminder() {
        const title = document.getElementById('reminderTitle').value.trim();
        const context = document.getElementById('reminderContext').value.trim();
        const priority = document.getElementById('reminderPriority').value;

        if (!title || !context) {
            window.showToast('Please fill in all fields');
            return;
        }

        try {
            if (this.currentEditingId) {
                // Update existing reminder
                const reminder = this.reminders.find(r => r.id === this.currentEditingId);
                reminder.title = title;
                reminder.context = context;
                reminder.priority = priority;
                await window.storageManager.updateReminder(reminder);
                window.showToast('<svg class="icon success" viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="margin-right:8px; vertical-align:text-bottom;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> Reminder updated');
            } else {
                // Create new reminder
                const reminder = {
                    id: 'reminder_' + Date.now(),
                    title,
                    context,
                    priority,
                    enabled: true,
                    createdAt: Date.now(),
                    lastTriggered: null
                };
                await window.storageManager.addReminder(reminder);
                window.showToast('<svg class="icon success" viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="margin-right:8px; vertical-align:text-bottom;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> Reminder created');
            }

            // Refresh list
            await this.loadReminders();
            this.render();
            this.hideReminderModal();

            // Sync to server
            window.wsManager.send({
                type: 'sync_rules',
                rules: this.reminders
            });

        } catch (error) {
            console.error('Error saving reminder:', error);
            window.showToast('Save failed, please try again');
        }
    }

    // Toggle reminder enabled status
    async toggleReminder(id, enabled) {
        try {
            const reminder = this.reminders.find(r => r.id === id);
            if (reminder) {
                reminder.enabled = enabled;
                await window.storageManager.updateReminder(reminder);
                window.showToast(enabled ? 'Reminder enabled' : 'Reminder disabled');

                // Sync to server
                window.wsManager.send({
                    type: 'sync_rules',
                    rules: this.reminders
                });
            }
        } catch (error) {
            console.error('Error toggling reminder:', error);
        }
    }

    // Edit reminder
    editReminder(id) {
        const reminder = this.reminders.find(r => r.id === id);
        if (reminder) {
            this.showReminderModal(reminder);
        }
    }

    // Delete reminder
    async deleteReminder(id) {
        if (!confirm('Are you sure you want to delete this reminder?')) {
            return;
        }

        try {
            await window.storageManager.deleteReminder(id);
            await this.loadReminders();
            this.render();
            window.showToast('Reminder deleted');

            // Sync to server
            window.wsManager.send({
                type: 'sync_rules',
                rules: this.reminders
            });
        } catch (error) {
            console.error('Error deleting reminder:', error);
            window.showToast('Delete failed, please retry');
        }
    }

    // Get priority label
    getPriorityLabel(priority) {
        const labels = {
            'high': 'High',
            'medium': 'Medium',
            'low': 'Low'
        };
        return labels[priority] || priority;
    }

    // Format relative time
    formatRelativeTime(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 60) return `${minutes} minutes ago`;
        if (hours < 24) return `${hours} hours ago`;
        return `${days} days ago`;
    }

    // Escape HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Export global instance
window.remindersManager = new RemindersManager();
