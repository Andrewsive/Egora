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

            this.initialized = true;
            console.log('✨ App initialization complete!');

        } catch (error) {
            console.error('❌ Error initializing app:', error);
            this.showError('应用初始化失败，请刷新页面重试');
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
                    window.showToast('✅ 通知已启用');
                    // Show a test notification
                    setTimeout(() => {
                        window.notificationManager.show('通知已启用', {
                            body: '您将及时收到情境提醒',
                            requireInteraction: false
                        });
                    }, 500);
                } else {
                    window.showToast('⚠️ 通知权限被拒绝');
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
                window.showToast('您可以稍后在设置中启用通知');
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
                    case 'acknowledged': msg = '✅ 已确认'; break;
                    case 'snoozed': msg = '⏰ 已推迟'; break;
                    case 'dismissed': msg = '❌ 已忽略'; break;
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
                messageEl.textContent = message;
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
                window.showToast('✅ 数据导出成功');
            } catch (error) {
                console.error('Export error:', error);
                window.showToast('❌ 导出失败: ' + error.message);
            }
        });

        // Import data
        document.getElementById('importDataInput')?.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                const imported = await window.dataManager.importData(file);
                window.showToast(`✅ 导入成功: ${imported.reminders}个提醒, ${imported.timeline}个事件, ${imported.insights}个洞察`);

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
                console.error('Import error:', error);
                window.showToast('❌ 导入失败: ' + error.message);
            }

            // Reset input
            e.target.value = '';
        });

        // Clear all data
        document.getElementById('clearDataBtn')?.addEventListener('click', async () => {
            if (!confirm('确定要清除所有数据吗？此操作不可恢复！')) {
                return;
            }

            if (!confirm('再次确认：真的要删除所有提醒、时间线和洞察数据吗？')) {
                return;
            }

            try {
                await window.dataManager.clearAllData();
                window.showToast('✅ 所有数据已清除');

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
                window.showToast('❌ 清除失败: ' + error.message);
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
