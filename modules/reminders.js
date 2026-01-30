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
                title: '买牛奶',
                context: '当我在超市时',
                priority: 'medium',
                enabled: true,
                createdAt: now - 86400000,
                lastTriggered: now - 3600000
            },
            {
                id: 'reminder_2',
                title: '给妈妈打电话',
                context: '当我在回家的路上时',
                priority: 'high',
                enabled: true,
                createdAt: now - 172800000,
                lastTriggered: null
            },
            {
                id: 'reminder_3',
                title: '喝水休息',
                context: '当我在办公室工作超过2小时时',
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
            ? `最后触发：${this.formatRelativeTime(reminder.lastTriggered)}`
            : '从未触发';

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
                    <button class="btn btn-small btn-secondary" data-action="edit">✏️ 编辑</button>
                    <button class="btn btn-small btn-secondary" data-action="delete" style="color: var(--color-danger);">🗑️ 删除</button>
                </div>
            </div>
        `;
    }

    // Render empty state
    renderEmpty() {
        const message = this.searchQuery
            ? `未找到匹配"${this.searchQuery}"的提醒`
            : '还没有创建提醒';

        this.container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔔</div>
                <div class="empty-text">${message}</div>
                <div class="empty-subtext">点击右上角的"➕"按钮创建新提醒</div>
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
            modalTitle.textContent = '编辑提醒';
            document.getElementById('reminderTitle').value = reminder.title;
            document.getElementById('reminderContext').value = reminder.context;
            document.getElementById('reminderPriority').value = reminder.priority;
            this.currentEditingId = reminder.id;
        } else {
            // Create mode
            modalTitle.textContent = '创建提醒';
            form.reset();
            this.currentEditingId = null;
        }

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
            window.showToast('请填写完整信息');
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
                window.showToast('提醒已更新');
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
                window.showToast('提醒已创建');
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
            window.showToast('保存失败，请重试');
        }
    }

    // Toggle reminder enabled status
    async toggleReminder(id, enabled) {
        try {
            const reminder = this.reminders.find(r => r.id === id);
            if (reminder) {
                reminder.enabled = enabled;
                await window.storageManager.updateReminder(reminder);
                window.showToast(enabled ? '提醒已启用' : '提醒已禁用');

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
        if (!confirm('确定要删除这个提醒吗？')) {
            return;
        }

        try {
            await window.storageManager.deleteReminder(id);
            await this.loadReminders();
            this.render();
            window.showToast('提醒已删除');

            // Sync to server
            window.wsManager.send({
                type: 'sync_rules',
                rules: this.reminders
            });
        } catch (error) {
            console.error('Error deleting reminder:', error);
            window.showToast('删除失败，请重试');
        }
    }

    // Get priority label
    getPriorityLabel(priority) {
        const labels = {
            'high': '高',
            'medium': '中',
            'low': '低'
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

        if (minutes < 60) return `${minutes}分钟前`;
        if (hours < 24) return `${hours}小时前`;
        return `${days}天前`;
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
