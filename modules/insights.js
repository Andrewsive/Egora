// ===================================
// Insights Module - AI Suggestions & Patterns
// ===================================

class InsightsManager {
    constructor() {
        this.container = null;
        this.insights = [];
    }

    // Initialize insights
    async init() {
        this.container = document.getElementById('insightsContent');

        // Load insights from storage
        await this.loadInsights();

        // Render insights
        this.render();

        // Update badge
        this.updateBadge();
    }

    // Load insights from storage
    async loadInsights() {
        try {
            this.insights = await window.storageManager.getInsights();

            // If no insights, create demo data (only on first load)
            const hasInteracted = window.storageManager.getLocal('insights_interacted', false);
            if (this.insights.length === 0 && !hasInteracted) {
                await this.createDemoData();
                this.insights = await window.storageManager.getInsights();
            }
        } catch (error) {
            console.error('Error loading insights:', error);
            this.insights = [];
        }
    }

    // Create demo data
    async createDemoData() {
        const demoInsights = [
            {
                id: 'insight_1',
                type: 'pattern_found',
                title: '发现购物模式',
                description: '你似乎经常在超市时忘记查看购物清单。是否需要在检测到你在超市时自动显示清单？',
                confidence: 0.87,
                basedOnEvents: ['evt_1', 'evt_3'],
                suggestedAction: {
                    type: 'create_reminder',
                    title: '查看购物清单',
                    context: '当我在超市时'
                }
            },
            {
                id: 'insight_2',
                type: 'new_reminder',
                title: '健康提醒建议',
                description: '根据您的作息规律，发现您每天下午3点左右都在咖啡厅工作。建议设置定时提醒，休息并补充水分。',
                confidence: 0.92,
                basedOnEvents: ['evt_2'],
                suggestedAction: {
                    type: 'create_reminder',
                    title: '休息并喝水',
                    context: '当我在咖啡厅工作超过2小时时'
                }
            },
            {
                id: 'insight_3',
                type: 'modify_rule',
                title: '优化现有提醒',
                description: '您的"给妈妈打电话"提醒在工作时间触发后经常被忽略。建议调整为周末或下班后触发。',
                confidence: 0.78,
                basedOnEvents: ['evt_3'],
                suggestedAction: {
                    type: 'modify_reminder',
                    reminderId: 'reminder_2',
                    newContext: '当我在周末或下班回家后'
                }
            }
        ];

        for (const insight of demoInsights) {
            await window.storageManager.addInsight(insight);
        }
    }

    // Render insights
    render() {
        if (!this.container) return;

        if (this.insights.length === 0) {
            this.renderEmpty();
            return;
        }

        // Sort by confidence
        const sorted = [...this.insights].sort((a, b) => b.confidence - a.confidence);

        const html = sorted.map(insight => this.renderInsight(insight)).join('');
        this.container.innerHTML = html;

        // Add event listeners
        this.attachInsightListeners();
    }

    // Render single insight
    renderInsight(insight) {
        const typeConfig = {
            'pattern_found': { icon: '🔍', label: '模式发现' },
            'new_reminder': { icon: '💡', label: '新提醒建议' },
            'modify_rule': { icon: '✨', label: '优化建议' }
        };

        const config = typeConfig[insight.type] || typeConfig['pattern_found'];

        return `
            <div class="insight-card" data-insight-id="${insight.id}">
                <div class="insight-header">
                    <div class="insight-icon">${config.icon}</div>
                    <div class="insight-title">
                        <div class="insight-type">${config.label}</div>
                        <h3 class="insight-heading">${this.escapeHtml(insight.title)}</h3>
                    </div>
                </div>
                <p class="insight-description">${this.escapeHtml(insight.description)}</p>
                <div style="margin-bottom: 1rem;">
                    <div style="font-size: 0.875rem; color: var(--color-text-tertiary); margin-bottom: 0.25rem;">
                        AI置信度
                    </div>
                    <div class="confidence-bar">
                        <div class="confidence-fill" style="width: ${insight.confidence * 100}%"></div>
                    </div>
                    <div style="font-size: 0.875rem; color: var(--color-text-secondary); margin-top: 0.25rem;">
                        ${(insight.confidence * 100).toFixed(0)}%
                    </div>
                </div>
                <div class="insight-actions">
                    <button class="btn btn-primary" data-action="accept">
                        ✅ 采纳建议
                    </button>
                    <button class="btn btn-secondary" data-action="dismiss">
                        ❌ 忽略
                    </button>
                </div>
            </div>
        `;
    }

    // Render empty state
    renderEmpty() {
        this.container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">💡</div>
                <div class="empty-text">暂无AI洞察</div>
                <div class="empty-subtext">系统会分析您的使用习惯，并提供智能建议</div>
            </div>
        `;
    }

    // Attach event listeners
    attachInsightListeners() {
        this.container.querySelectorAll('.insight-card').forEach(card => {
            const id = card.dataset.insightId;

            // Accept button
            const acceptBtn = card.querySelector('[data-action="accept"]');
            acceptBtn?.addEventListener('click', () => {
                this.acceptInsight(id);
            });

            // Dismiss button
            const dismissBtn = card.querySelector('[data-action="dismiss"]');
            dismissBtn?.addEventListener('click', () => {
                this.dismissInsight(id);
            });
        });
    }

    // Accept insight and apply suggestion
    async acceptInsight(id) {
        const insight = this.insights.find(i => i.id === id);
        if (!insight) {
            console.error('Insight not found:', id);
            return;
        }

        // Validate insight structure
        if (!insight.suggestedAction) {
            console.error('Invalid insight: missing suggestedAction', insight);
            window.showToast('洞察数据异常，请刷新页面重试');
            return;
        }

        try {
            const action = insight.suggestedAction;

            if (action.type === 'create_reminder') {
                // Create new reminder based on suggestion
                const reminder = {
                    id: 'reminder_' + Date.now(),
                    title: action.title,
                    context: action.context,
                    priority: 'medium',
                    enabled: true,
                    createdAt: Date.now(),
                    lastTriggered: null
                };

                await window.storageManager.addReminder(reminder);
                await window.remindersManager.loadReminders();
                window.remindersManager.render();

                window.showToast('✅ 已创建新提醒');

            } else if (action.type === 'modify_reminder') {
                // Modify existing reminder
                const reminder = await window.storageManager.get('reminders', action.reminderId);
                if (reminder) {
                    reminder.context = action.newContext;
                    await window.storageManager.updateReminder(reminder);
                    await window.remindersManager.loadReminders();
                    window.remindersManager.render();
                    window.showToast('✅ 已更新提醒');
                } else {
                    console.warn('Reminder not found, creating new one instead');
                    // If reminder doesn't exist, create a new one
                    const newReminder = {
                        id: 'reminder_' + Date.now(),
                        title: insight.title,
                        context: action.newContext,
                        priority: 'medium',
                        enabled: true,
                        createdAt: Date.now(),
                        lastTriggered: null
                    };
                    await window.storageManager.addReminder(newReminder);
                    await window.remindersManager.loadReminders();
                    window.remindersManager.render();
                    window.showToast('✅ 已创建新提醒');
                }
            }

            // Remove the insight (silent mode - no toast)
            await this.dismissInsight(id, true);

            // Sync to server
            window.wsManager.send({
                type: 'insight_accepted',
                insightId: id
            });

        } catch (error) {
            console.error('Error accepting insight:', error);
            window.showToast('操作失败，请重试');
        }
    }

    // Dismiss insight
    async dismissInsight(id, silent = false) {
        try {
            // Mark that user has interacted with insights
            window.storageManager.setLocal('insights_interacted', true);

            await window.storageManager.deleteInsight(id);
            await this.loadInsights();
            this.render();
            this.updateBadge();

            // Only show toast if not in silent mode
            if (!silent) {
                window.showToast('已忽略建议');
            }

            // Sync to server
            window.wsManager.send({
                type: 'insight_dismissed',
                insightId: id
            });
        } catch (error) {
            console.error('Error dismissing insight:', error);
        }
    }

    // Add new insight
    async addInsight(insight) {
        insight.id = insight.id || 'insight_' + Date.now();

        await window.storageManager.addInsight(insight);
        await this.loadInsights();
        this.render();
        this.updateBadge();

        // Show notification
        window.notificationManager.showInsight(insight);
        window.showToast('💡 收到新的AI洞察');
    }

    // Update insights badge
    updateBadge() {
        const badge = document.getElementById('insightsBadge');
        if (badge) {
            badge.textContent = this.insights.length;
            badge.style.display = this.insights.length > 0 ? 'inline-block' : 'none';
        }
    }

    // Escape HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Export global instance
window.insightsManager = new InsightsManager();
