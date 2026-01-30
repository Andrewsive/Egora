// ===================================
// Notifications Module - Web Notifications API
// ===================================

class NotificationManager {
    constructor() {
        this.permission = Notification.permission;
        this.notificationSound = null;
    }

    // Check if notifications are supported
    isSupported() {
        return 'Notification' in window;
    }

    // Request notification permission
    async requestPermission() {
        if (!this.isSupported()) {
            console.warn('Notifications not supported');
            return false;
        }

        if (this.permission === 'granted') {
            return true;
        }

        try {
            const result = await Notification.requestPermission();
            this.permission = result;
            return result === 'granted';
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            return false;
        }
    }

    // Show notification
    async show(title, options = {}) {
        if (!this.isSupported()) {
            console.warn('Notifications not supported');
            return null;
        }

        if (this.permission !== 'granted') {
            const granted = await this.requestPermission();
            if (!granted) {
                console.warn('Notification permission denied');
                return null;
            }
        }

        const defaultOptions = {
            icon: this.getIconDataUrl(),
            badge: this.getIconDataUrl(),
            vibrate: [200, 100, 200],
            requireInteraction: false,
            ...options
        };

        try {
            const notification = new Notification(title, defaultOptions);

            // Play sound if enabled
            this.playNotificationSound();

            // Handle notification click
            notification.onclick = () => {
                window.focus();
                notification.close();

                // Trigger custom event
                if (options.onClick) {
                    options.onClick();
                }
            };

            return notification;
        } catch (error) {
            console.error('Error showing notification:', error);
            return null;
        }
    }

    // Show reminder notification
    async showReminder(reminder, context) {
        const options = {
            body: `${context}\n\n提醒：${reminder.title}`,
            tag: reminder.id,
            icon: this.getIconDataUrl(),
            requireInteraction: true,
            data: {
                type: 'reminder',
                reminderId: reminder.id
            },
            actions: [
                { action: 'acknowledge', title: '知道了' },
                { action: 'snooze', title: '稍后提醒' }
            ]
        };

        return await this.show('🔔 情境提醒', options);
    }

    // Show context detection notification
    async showContextDetected(context, confidence) {
        const options = {
            body: `检测到情境：${context}\n置信度：${(confidence * 100).toFixed(0)}%`,
            tag: 'context_' + Date.now(),
            requireInteraction: false,
            data: {
                type: 'context_detected'
            }
        };

        return await this.show('👁️ 情境检测', options);
    }

    // Show AI insight notification
    async showInsight(insight) {
        const options = {
            body: insight.description,
            tag: insight.id,
            requireInteraction: false,
            data: {
                type: 'insight',
                insightId: insight.id
            }
        };

        return await this.show('💡 AI洞察', options);
    }

    // Play notification sound
    playNotificationSound(soundType = 'default') {
        // For now, we'll use the system notification sound
        // In the future, you can add custom sounds

        // Optional: Create a simple beep using Web Audio API
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            const audioContext = new AudioContext();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (error) {
            // Silently fail if audio not supported
        }
    }

    // Get notification icon as data URL
    getIconDataUrl() {
        // Use URI encoding instead of btoa to avoid character encoding issues
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#6366f1;stop-opacity:1"/><stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:1"/></linearGradient></defs><circle cx="50" cy="50" r="45" fill="url(#grad)"/><circle cx="50" cy="35" r="8" fill="white"/><path d="M 50 45 L 50 70" stroke="white" stroke-width="6" stroke-linecap="round"/></svg>`;
        // Use URI encoding instead of base64 to avoid btoa encoding issues
        return 'data:image/svg+xml,' + encodeURIComponent(svg);
    }

    // Check permission status
    hasPermission() {
        return this.permission === 'granted';
    }

    // Show permission prompt UI
    showPermissionPrompt() {
        const prompt = document.getElementById('notificationPrompt');
        if (prompt) {
            prompt.classList.remove('hidden');
        }
    }

    // Hide permission prompt UI
    hidePermissionPrompt() {
        const prompt = document.getElementById('notificationPrompt');
        if (prompt) {
            prompt.classList.add('hidden');
        }
    }
}

// Export global instance
window.notificationManager = new NotificationManager();
