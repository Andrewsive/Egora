// ===================================
// Main Application - Initialization & Coordination
// ===================================

class ContextReminderApp {
    constructor() {
        this.currentView = 'timeline';
        this.initialized = false;
    }

    // Initialize application
    async init() {
        console.log('🚀 Initializing Context Reminder App...');

        try {
            // Initialize storage
            await window.storageManager.init();
            console.log('✅ Storage initialized');

            // Initialize modules
            await window.timelineManager.init();
            await window.remindersManager.init();
            await window.insightsManager.init();
            console.log('✅ Modules initialized');

            // Setup navigation
            this.setupNavigation();
            console.log('✅ Navigation setup complete');

            // Setup global utilities (must be before other setups that use showToast)
            this.setupUtilities();
            console.log('✅ Utilities setup complete');

            // Setup WebSocket event handlers
            this.setupWebSocketHandlers();
            console.log('✅ WebSocket handlers registered');

            // Connect to WebSocket (mock)
            window.wsManager.connect();
            console.log('✅ WebSocket connection initiated');

            // Setup notification permission
            this.setupNotifications();
            console.log('✅ Notification setup complete');

            // Setup modal event listeners
            this.setupModals();
            console.log('✅ Modals setup complete');

            // Setup settings panel
            this.setupSettings();
            console.log('✅ Settings setup complete');

            // Check if test reminder trigger is set
            if (sessionStorage.getItem('testReminderTrigger') === 'true') {
                sessionStorage.removeItem('testReminderTrigger');
                // Trigger a test reminder after a short delay
                setTimeout(() => {
                    this.triggerTestReminder();
                }, 1000);
            }

            this.initialized = true;
            console.log('✨ App initialization complete!');

        } catch (error) {
            console.error('❌ Error initializing app:', error);
            this.showError('App initialization failed, please refresh and try again');
        }
    }

    // Setup navigation between views
    setupNavigation() {
        const navBtns = document.querySelectorAll('.nav-btn');

        navBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const view = btn.dataset.view;
                this.switchView(view);
            });
        });
    }

    // Switch between views
    switchView(viewName) {
        if (this.currentView === viewName) return;

        // Hide all views
        document.querySelectorAll('.view-container').forEach(view => {
            view.classList.remove('active');
        });

        // Show target view
        const targetView = document.getElementById(`${viewName}View`);
        if (targetView) {
            targetView.classList.add('active');
        }

        // Update navigation buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.view === viewName) {
                btn.classList.add('active');
            }
        });

        this.currentView = viewName;
    }

    // Setup WebSocket event handlers
    setupWebSocketHandlers() {
        // Connection opened
        window.wsManager.on('open', () => {
            console.log('WebSocket connected, sending registration...');
            window.wsManager.send({
                type: 'register_device',
                deviceId: this.getDeviceId()
            });
        });

        // Context detected
        window.wsManager.on('context_detected', async (data) => {
            console.log('Context detected:', data);

            // Add to timeline
            await window.timelineManager.addEvent({
                type: 'context_detected',
                contextDescription: data.contextDescription,
                aiConfidence: data.confidence,
                timestamp: data.timestamp
            });

            // Show notification if high confidence
            if (data.confidence > 0.8) {
                await window.notificationManager.showContextDetected(
                    data.contextDescription,
                    data.confidence
                );
            }
        });

        // Reminder triggered
        window.wsManager.on('trigger_reminder', async (data) => {
            console.log('Reminder triggered:', data);

            // Get reminder details
            const reminder = await window.storageManager.get('reminders', data.reminderId);

            if (reminder) {
                // Update last triggered time
                reminder.lastTriggered = data.timestamp;
                await window.storageManager.updateReminder(reminder);
                await window.remindersManager.loadReminders();
                window.remindersManager.render();

                // Add to timeline and get ID
                const eventId = await window.timelineManager.addEvent({
                    type: 'reminder_triggered',
                    contextDescription: data.contextMatch,
                    reminderTitle: data.reminderTitle || reminder.title,
                    reminderId: data.reminderId,
                    aiConfidence: 0.9,
                    timestamp: data.timestamp,
                    userResponse: null
                });

                // Show interactive modal
                const modal = document.getElementById('reminderActionModal');
                if (modal) {
                    this.currentReminderEventId = eventId;
                    const titleEl = document.getElementById('reminderModalTitle');
                    const contextEl = document.getElementById('reminderModalContext');

                    if (titleEl) titleEl.textContent = reminder.title;
                    if (contextEl) contextEl.textContent = data.contextMatch;

                    modal.classList.add('active');
                }

                // Show notification (for background)
                await window.notificationManager.showReminder(
                    reminder,
                    data.contextMatch
                );

                // Show toast
                window.showToast(`🔔 ${reminder.title}`);
            }
        });

        // AI insight received
        window.wsManager.on('ai_insight', async (data) => {
            console.log('AI insight received:', data);
            await window.insightsManager.addInsight(data.suggestion);
        });
    }

    // Setup notifications
    async setupNotifications() {
        console.log('🔔 Setting up notifications...');

        // Check if notifications are supported
        if (!window.notificationManager.isSupported()) {
            console.warn('Notifications not supported in this browser');
            return;
        }

        // Check permission status
        if (!window.notificationManager.hasPermission()) {
            // Show permission prompt after a delay
            setTimeout(() => {
                window.notificationManager.showPermissionPrompt();
            }, 3000);
        }

        // Setup permission prompt buttons
        const enableBtn = document.getElementById('enableNotificationBtn');
        const skipBtn = document.getElementById('skipNotificationBtn');

        console.log('🔍 Enable button found:', enableBtn);
        console.log('🔍 Skip button found:', skipBtn);

        if (enableBtn) {
            console.log('✅ Adding click listener to enable button');
            enableBtn.addEventListener('click', async () => {
                console.log('🖱️ Enable button clicked!');
                const granted = await window.notificationManager.requestPermission();
                console.log('Permission result:', granted);

                window.notificationManager.hidePermissionPrompt();

                if (granted) {
                    window.showToast('<svg class="icon success" viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="margin-right:8px; vertical-align:text-bottom;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> Notifications enabled');
                    // Show a test notification
                    setTimeout(() => {
                        window.notificationManager.show('Notifications Enabled', {
                            body: 'You will receive context reminders in time',
                            requireInteraction: false
                        });
                    }, 500);
                } else {
                    window.showToast('⚠️ Notification permission denied');
                }
            });
        } else {
            console.error('❌ Enable button not found!');
        }

        if (skipBtn) {
            console.log('✅ Adding click listener to skip button');
            skipBtn.addEventListener('click', () => {
                console.log('🖱️ Skip button clicked!');
                window.notificationManager.hidePermissionPrompt();
                window.showToast('You can enable notifications later in settings');
            });
        } else {
            console.error('❌ Skip button not found!');
        }
    }

    // Setup modal event listeners
    setupModals() {
        // Event details modal close
        document.getElementById('closeEventModalBtn')?.addEventListener('click', () => {
            document.getElementById('eventModal').classList.remove('active');
        });

        document.querySelector('#eventModal .modal-overlay')?.addEventListener('click', () => {
            document.getElementById('eventModal').classList.remove('active');
        });

        // Reminder Action Modal
        const handleReminderResponse = async (response) => {
            const modal = document.getElementById('reminderActionModal');
            modal?.classList.remove('active');

            if (this.currentReminderEventId) {
                await window.timelineManager.updateEventStatus(this.currentReminderEventId, response);

                let msg = '';
                switch (response) {
                    case 'acknowledged': msg = '<svg class="icon success" viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="margin-right:8px; vertical-align:text-bottom;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> Acknowledged'; break;
                    case 'snoozed': msg = '<svg class="icon warning" viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="margin-right:8px; vertical-align:text-bottom;"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> Snoozed'; break;
                    case 'dismissed': msg = '<svg class="icon danger" viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="margin-right:8px; vertical-align:text-bottom;"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg> Dismissed'; break;
                }
                window.showToast(msg);
                this.currentReminderEventId = null;
            }
        };

        document.getElementById('ackReminderBtn')?.addEventListener('click', () => handleReminderResponse('acknowledged'));
        document.getElementById('snoozeReminderBtn')?.addEventListener('click', () => handleReminderResponse('snoozed'));
        document.getElementById('dismissReminderBtn')?.addEventListener('click', () => handleReminderResponse('dismissed'));
    }

    // Setup global utilities
    setupUtilities() {
        // Global toast function
        window.showToast = (message, duration = 3000) => {
            const toast = document.getElementById('toast');
            const messageEl = document.getElementById('toastMessage');

            if (toast && messageEl) {
                messageEl.innerHTML = message;
                toast.classList.remove('hidden');
                toast.classList.add('show');

                setTimeout(() => {
                    toast.classList.remove('show');
                    setTimeout(() => {
                        toast.classList.add('hidden');
                    }, 300);
                }, duration);
            }
        };

        // Settings button
        document.getElementById('settingsBtn')?.addEventListener('click', () => {
            const modal = document.getElementById('settingsModal');
            modal?.classList.add('active');
        });
    }

    // Setup settings panel
    setupSettings() {
        const modal = document.getElementById('settingsModal');
        const closeBtn = document.getElementById('closeSettingsBtn');
        const overlay = modal?.querySelector('.modal-overlay');

        // Close modal
        const closeModal = () => {
            modal?.classList.remove('active');
        };

        closeBtn?.addEventListener('click', closeModal);
        overlay?.addEventListener('click', closeModal);

        // Export data
        document.getElementById('exportDataBtn')?.addEventListener('click', async () => {
            try {
                await window.dataManager.exportData();
                window.showToast('<svg class="icon success" viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="margin-right:8px; vertical-align:text-bottom;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> Data exported successfully');
            } catch (error) {
                console.error('Export error:', error);
                window.showToast('❌ Export failed: ' + error.message);
            }
        });

        // Import data
        document.getElementById('importDataInput')?.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                const imported = await window.dataManager.importData(file);
                window.showToast('<svg class="icon success" viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="margin-right:8px; vertical-align:text-bottom;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> Import successful: ' + imported.reminders + ' reminders, ' + imported.timeline + ' events, ' + imported.insights + ' insights');

                // Refresh all views using correct method names
                await window.timelineManager.loadEvents();
                window.timelineManager.render();
                await window.remindersManager.loadReminders();
                window.remindersManager.render();
                await window.insightsManager.loadInsights();
                window.insightsManager.render();
                window.insightsManager.updateBadge();

                closeModal();

                // Reset input
                e.target.value = '';
            } catch (error) {
                console.error('Import error:', error);
                window.showToast('Import failed: ' + error.message);
            }
        });

        // Clear all data
        document.getElementById('clearDataBtn')?.addEventListener('click', async () => {
            if (!confirm('Are you sure you want to clear all data? This action cannot be undone!')) {
                return;
            }

            if (!confirm('Confirm again: Do you really want to delete all reminders, timeline, and insights data?')) {
                return;
            }

            try {
                await window.dataManager.clearAllData();
                window.showToast('<svg class="icon success" viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="margin-right:8px; vertical-align:text-bottom;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> All data cleared');

                // Refresh all views using correct method names
                await window.timelineManager.loadEvents();
                window.timelineManager.render();
                await window.remindersManager.loadReminders();
                window.remindersManager.render();
                await window.insightsManager.loadInsights();
                window.insightsManager.render();
                window.insightsManager.updateBadge();

                closeModal();
            } catch (error) {
                console.error('Clear error:', error);
                window.showToast('❌ Clear failed: ' + error.message);
            }
        });
    }

    // Get device ID (or generate one)
    getDeviceId() {
        let deviceId = localStorage.getItem('device_id');
        if (!deviceId) {
            deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('device_id', deviceId);
        }
        return deviceId;
    }

    // Show error message
    showError(message) {
        alert(message);
    }

    // Test function: Trigger reminder action modal for testing
    async triggerTestReminder() {
        console.log('🧪 Triggering test reminder modal...');

        // Get or create a test reminder
        let testReminder = this.reminders?.find(r => r.title === 'Buy Milk');

        if (!testReminder) {
            // Create a test reminder if it doesn't exist
            testReminder = {
                id: 'test_reminder_' + Date.now(),
                title: 'Buy Milk',
                context: 'When I\'m at the supermarket',
                priority: 'high',
                enabled: true,
                createdAt: Date.now(),
                lastTriggered: Date.now()
            };
        }

        // Simulate a reminder trigger event
        const eventId = await window.timelineManager.addEvent({
            type: 'reminder_triggered',
            contextDescription: 'User is at the supermarket milk aisle',
            reminderTitle: testReminder.title,
            reminderId: testReminder.id,
            aiConfidence: 0.95,
            timestamp: Date.now(),
            userResponse: null
        });

        // Show the reminder action modal
        this.currentReminderEventId = eventId;
        const modal = document.getElementById('reminderActionModal');
        if (modal) {
            const titleEl = document.getElementById('reminderModalTitle');
            const contextEl = document.getElementById('reminderModalContext');

            if (titleEl) titleEl.textContent = testReminder.title;
            if (contextEl) contextEl.textContent = 'User is at the supermarket milk aisle';

            modal.classList.add('active');
            console.log('✅ Test reminder modal opened!');
        } else {
            console.error('❌ Reminder action modal not found!');
        }
    }
}

// ===================================
// App Initialization
// ===================================

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

async function initApp() {
    console.log('DOM ready, starting app...');

    const app = new ContextReminderApp();
    await app.init();

    // Make app instance globally accessible for debugging
    window.app = app;
}

// ===================================
// Service Worker Registration (PWA)
// ===================================

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('ServiceWorker registered:', registration);
            })
            .catch(error => {
                console.log('ServiceWorker registration failed:', error);
            });
    });
}
