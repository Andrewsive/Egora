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
            let insights = await window.storageManager.getInsights();

            // Filter out invalid insights (must have id, type, title, description, confidence)
            this.insights = insights.filter(insight => {
                const isValid = insight &&
                    insight.id &&
                    insight.type &&
                    insight.title &&
                    insight.description &&
                    typeof insight.confidence === 'number';

                if (!isValid) {
                    console.warn('Invalid insight found and filtered out:', insight);
                }
                return isValid;
            });

            // If no insights, create demo data (only on first load)
            const hasInteracted = window.storageManager.getLocal('insights_interacted', false);
            if (this.insights.length === 0 && !hasInteracted) {
                await this.createDemoData();
                insights = await window.storageManager.getInsights();
                // Filter again after loading demo data
                this.insights = insights.filter(insight => {
                    return insight && insight.id && insight.type && insight.title &&
                        insight.description && typeof insight.confidence === 'number';
                });
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
                title: 'Shopping Pattern Detected',
                description: 'You often forget to check your shopping list when at the supermarket. Would you like to automatically display the list when you are detected at  the supermarket?',
                confidence: 0.87,
                basedOnEvents: ['evt_1', 'evt_3'],
                suggestedAction: {
                    type: 'create_reminder',
                    title: 'Check Shopping List',
                    context: 'When I am at the supermarket'
                }
            },
            {
                id: 'insight_2',
                type: 'new_reminder',
                title: 'Health Reminder Suggestion',
                description: 'Based on your routine, you work at a cafe around 3 PM daily. Suggest setting a reminder to take a break and hydrate.',
                confidence: 0.92,
                basedOnEvents: ['evt_2'],
                suggestedAction: {
                    type: 'create_reminder',
                    title: 'Take a Break and Drink Water',
                    context: 'When I have been working at a cafe for more than 2 hours'
                }
            },
            {
                id: 'insight_3',
                type: 'modify_rule',
                title: 'Optimize Existing Reminder',
                description: 'Your "Call Mom" reminder is often dismissed when triggered during work hours. Suggest adjusting to trigger on weekends or after work.',
                confidence: 0.78,
                basedOnEvents: ['evt_3'],
                suggestedAction: {
                    type: 'modify_reminder',
                    reminderId: 'reminder_2',
                    newContext: 'When I am on weekends or after work heading home'
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
            'pattern_found': { icon: '🔍', label: 'Pattern Found' },
            'new_reminder': { icon: '💡', label: 'New Reminder Suggestion' },
            'modify_rule': { icon: '✨', label: 'Optimization Suggestion' }
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
                        AI Confidence
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
                        <svg class="icon" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> Accept Suggestion
                    </button>
                    <button class="btn btn-secondary" data-action="dismiss">
                        <svg class="icon" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> Dismiss
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
                <div class="empty-text">No AI Insights Yet</div>
                <div class="empty-subtext">The system will analyze your usage patterns and provide intelligent suggestions</div>
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
            window.showToast('Insight data error, please refresh and try again');
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

                window.showToast('<svg class="icon success" viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="margin-right:8px; vertical-align:text-bottom;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> New reminder created');

            } else if (action.type === 'modify_reminder') {
                // Modify existing reminder
                const reminder = await window.storageManager.get('reminders', action.reminderId);
                if (reminder) {
                    reminder.context = action.newContext;
                    await window.storageManager.updateReminder(reminder);
                    await window.remindersManager.loadReminders();
                    window.remindersManager.render();
                    window.showToast('<svg class="icon success" viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="margin-right:8px; vertical-align:text-bottom;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> Reminder updated');
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
                    window.showToast('<svg class="icon success" viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="margin-right:8px; vertical-align:text-bottom;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> New reminder created');
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
            window.showToast('Operation failed, please try again');
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
                window.showToast('Suggestion dismissed');
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
        window.showToast('💡 New AI insight received');
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
