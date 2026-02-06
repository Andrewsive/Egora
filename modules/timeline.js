// ===================================
// Timeline Module - Event Rendering & Management
// ===================================

class TimelineManager {
    constructor() {
        this.container = null;
        this.events = [];
    }

    // Initialize timeline
    async init() {
        this.container = document.getElementById('timelineContent');

        // Load events from storage
        await this.loadEvents();

        // Render timeline
        this.render();

        // Set up refresh button
        document.getElementById('refreshTimelineBtn')?.addEventListener('click', () => {
            this.refresh();
        });
    }

    // Load events from storage
    async loadEvents() {
        try {
            this.events = await window.storageManager.getTimelineEvents();

            // If no events, create some demo data
            if (this.events.length === 0) {
                await this.createDemoData();
                this.events = await window.storageManager.getTimelineEvents();
            }
        } catch (error) {
            console.error('Error loading timeline events:', error);
            this.events = [];
        }
    }

    // Create demo data
    async createDemoData() {
        const now = Date.now();
        const demoEvents = [
            {
                id: 'evt_1',
                timestamp: now - 3600000, // 1 hour ago
                type: 'reminder_triggered',
                contextDescription: 'Detected you are at the supermarket milk aisle',
                reminderTitle: 'Buy Milk',
                reminderId: 'reminder_1',
                userResponse: 'acknowledged',
                aiConfidence: 0.92
            },
            {
                id: 'evt_2',
                timestamp: now - 7200000, // 2 hours ago
                type: 'context_detected',
                contextDescription: 'You are working at a cafe',
                aiConfidence: 0.85
            },
            {
                id: 'evt_3',
                timestamp: now - 86400000, // Yesterday
                type: 'reminder_triggered',
                contextDescription: 'Detected you are at the office',
                reminderTitle: 'Call Mom',
                reminderId: 'reminder_2',
                userResponse: 'dismissed',
                aiConfidence: 0.78
            },
            {
                id: 'evt_4',
                timestamp: now - 172800000, // 2 days ago
                type: 'context_detected',
                contextDescription: 'You are working out at the gym',
                aiConfidence: 0.88
            }
        ];

        for (const event of demoEvents) {
            await window.storageManager.addTimelineEvent(event);
        }
    }

    // Refresh timeline
    async refresh() {
        await this.loadEvents();
        this.render();
        window.showToast('Timeline refreshed');
    }

    // Render timeline
    render() {
        if (!this.container) return;

        if (this.events.length === 0) {
            this.renderEmpty();
            return;
        }

        // Group events by date
        const grouped = this.groupEventsByDate();

        let html = '';
        for (const [label, events] of Object.entries(grouped)) {
            html += `
                <div class="timeline-group">
                    <h3 class="timeline-group-title">${label}</h3>
                    ${events.map(event => this.renderEvent(event)).join('')}
                </div>
            `;
        }

        this.container.innerHTML = html;

        // Add click listeners
        this.container.querySelectorAll('.timeline-event').forEach(el => {
            el.addEventListener('click', () => {
                const eventId = el.dataset.eventId;
                const event = this.events.find(e => e.id === eventId);
                if (event) {
                    this.showEventDetails(event);
                }
            });
        });
    }

    // Render single event
    renderEvent(event) {
        const typeConfig = {
            'context_detected': { label: 'Context Detected', class: 'detected', icon: '👁️' },
            'reminder_triggered': { label: 'Reminder Triggered', class: 'triggered', icon: '🔔' },
            'user_response': { label: 'User Response', class: 'response', icon: '<svg class="icon" viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>' }
        };

        const config = typeConfig[event.type] || typeConfig['context_detected'];
        const time = this.formatTime(event.timestamp);

        return `
            <div class="timeline-event" data-event-id="${event.id}">
                <div class="event-header">
                    <span class="event-type ${config.class}">
                        ${config.icon} ${config.label}
                    </span>
                    <span class="event-time">${time}</span>
                </div>
                <div class="event-content">
                    ${event.reminderTitle ? `<div class="event-title">${event.reminderTitle}</div>` : ''}
                    <div class="event-description">${event.contextDescription}</div>
                </div>
                <div class="event-meta">
                    ${event.aiConfidence ? `
                        <div class="confidence-bar">
                            <div class="confidence-fill" style="width: ${event.aiConfidence * 100}%"></div>
                        </div>
                        <span>Confidence ${(event.aiConfidence * 100).toFixed(0)}%</span>
                    ` : ''}
                    ${event.userResponse ? `
                        <span>${this.getUserResponseLabel(event.userResponse)}</span>
                    ` : ''}
                </div>
            </div>
        `;
    }

    // Render empty state
    renderEmpty() {
        this.container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📭</div>
                <div class="empty-text">No Events Yet</div>
                <div class="empty-subtext">The system will automatically record context detection and reminder events</div>
            </div>
        `;
    }

    // Group events by date
    groupEventsByDate() {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const yesterday = today - 86400000;
        const weekAgo = today - 604800000;

        const groups = {
            'Today': [],
            'Yesterday': [],
            'This Week': [],
            'Earlier': []
        };

        this.events.forEach(event => {
            if (event.timestamp >= today) {
                groups['Today'].push(event);
            } else if (event.timestamp >= yesterday) {
                groups['Yesterday'].push(event);
            } else if (event.timestamp >= weekAgo) {
                groups['This Week'].push(event);
            } else {
                groups['Earlier'].push(event);
            }
        });

        // Remove empty groups
        Object.keys(groups).forEach(key => {
            if (groups[key].length === 0) {
                delete groups[key];
            }
        });

        return groups;
    }

    // Format timestamp to readable time
    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();

        const isToday = date.toDateString() === now.toDateString();

        if (isToday) {
            return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
        } else {
            return date.toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
        }
    }

    // Get user response label
    getUserResponseLabel(response) {
        const labels = {
            'acknowledged': '<svg class="icon success" viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> Acknowledged',
            'snoozed': '<svg class="icon warning" viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> Snoozed',
            'dismissed': '<svg class="icon danger" viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg> Dismissed'
        };
        return labels[response] || response;
    }

    // Show event details in modal
    showEventDetails(event) {
        const modal = document.getElementById('eventModal');
        const body = document.getElementById('eventModalBody');

        const typeConfig = {
            'context_detected': { label: 'Context Detected', icon: '👁️' },
            'reminder_triggered': { label: 'Reminder Triggered', icon: '🔔' },
            'user_response': { label: 'User Response', icon: '✅' }
        };

        const config = typeConfig[event.type] || typeConfig['context_detected'];

        body.innerHTML = `
            <div style="margin-bottom: 1.5rem;">
                <div style="font-size: 2rem; margin-bottom: 0.5rem;">${config.icon}</div>
                <div style="font-size: 0.875rem; color: var(--color-text-tertiary); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem;">
                    ${config.label}
                </div>
                <div style="font-size: 1rem; color: var(--color-text-secondary);">
                    ${this.formatTime(event.timestamp)}
                </div>
            </div>
            
            ${event.reminderTitle ? `
                <div style="margin-bottom: 1rem;">
                    <div style="font-weight: 600; margin-bottom: 0.5rem;">Reminder Content</div>
                    <div style="color: var(--color-text-secondary);">${event.reminderTitle}</div>
                </div>
            ` : ''}
            
            <div style="margin-bottom: 1rem;">
                <div style="font-weight: 600; margin-bottom: 0.5rem;">Context Description</div>
                <div style="color: var(--color-text-secondary);">${event.contextDescription}</div>
            </div>
            
            ${event.aiConfidence ? `
                <div style="margin-bottom: 1rem;">
                    <div style="font-weight: 600; margin-bottom: 0.5rem;">AI Confidence</div>
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div class="confidence-bar" style="flex: 1; margin-bottom: 0; min-height: 8px;">
                            <div class="confidence-fill" style="width: ${event.aiConfidence * 100}%"></div>
                        </div>
                        <div style="color: var(--color-text-secondary); font-size: 0.875rem; font-weight: 500; min-width: 40px; text-align: right;">
                            ${(event.aiConfidence * 100).toFixed(0)}%
                        </div>
                    </div>
                </div>
            ` : ''}
            
            ${event.userResponse ? `
                <div style="margin-bottom: 1rem;">
                    <div style="font-weight: 600; margin-bottom: 0.5rem;">Your Response</div>
                    <div style="color: var(--color-text-secondary);">${this.getUserResponseLabel(event.userResponse)}</div>
                </div>
            ` : ''}
        `;

        modal.classList.add('active');
    }

    // Update event status
    async updateEventStatus(id, response) {
        const event = this.events.find(e => e.id === id);
        if (event) {
            event.userResponse = response;
            // Use upsert to update in DB
            await window.storageManager.upsert('timeline', event);
            this.render();
            return true;
        }
        return false;
    }

    // Add new event
    async addEvent(event) {
        event.id = 'evt_' + Date.now();
        event.timestamp = event.timestamp || Date.now();

        await window.storageManager.addTimelineEvent(event);
        await this.loadEvents();
        this.render();
        return event.id; // Return ID for later updates
    }
}

// Export global instance
window.timelineManager = new TimelineManager();
