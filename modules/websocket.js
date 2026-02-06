// ===================================
// WebSocket Module - Mock Implementation
// ===================================

class WebSocketManager {
    constructor() {
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 3000;
        this.isConnected = false;
        this.listeners = {};

        // For demo purposes, we'll use a mock connection
        this.useMock = true;
        this.mockInterval = null;
    }

    // Initialize connection (mock or real)
    connect(url = 'ws://localhost:8765') {
        if (this.useMock) {
            this.connectMock();
        } else {
            this.connectRealWebSocket(url);
        }
    }

    // Mock WebSocket for demo
    connectMock() {
        console.log('🔌 Connecting to mock WebSocket...');

        setTimeout(() => {
            this.isConnected = true;
            this.updateConnectionStatus('connected');
            this.trigger('open', {});
            console.log('✅ Mock WebSocket connected');

            // Start sending mock events periodically
            this.startMockEvents();
        }, 1000);
    }

    // Real WebSocket connection (for future use)
    connectRealWebSocket(url) {
        console.log(`🔌 Connecting to WebSocket: ${url}`);

        try {
            this.ws = new WebSocket(url);

            this.ws.onopen = () => {
                console.log('✅ WebSocket connected');
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.updateConnectionStatus('connected');
                this.trigger('open', {});
            };

            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleMessage(data);
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };

            this.ws.onerror = (error) => {
                console.error('❌ WebSocket error:', error);
                this.trigger('error', error);
            };

            this.ws.onclose = () => {
                console.log('🔌 WebSocket disconnected');
                this.isConnected = false;
                this.updateConnectionStatus('disconnected');
                this.trigger('close', {});
                this.attemptReconnect();
            };

        } catch (error) {
            console.error('Failed to create WebSocket:', error);
            this.updateConnectionStatus('disconnected');
        }
    }

    // Handle incoming messages
    handleMessage(data) {
        console.log('📨 Received message:', data);

        switch (data.type) {
            case 'context_detected':
                this.trigger('context_detected', data);
                break;
            case 'trigger_reminder':
                this.trigger('trigger_reminder', data);
                break;
            case 'ai_insight':
                this.trigger('ai_insight', data);
                break;
            default:
                console.warn('Unknown message type:', data.type);
        }
    }

    // Send message to server
    send(data) {
        if (this.useMock) {
            console.log('📤 Mock send:', data);
            return;
        }

        if (this.ws && this.isConnected) {
            this.ws.send(JSON.stringify(data));
        } else {
            console.error('WebSocket not connected');
        }
    }

    // Reconnection logic
    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`🔄 Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            this.updateConnectionStatus('connecting');

            setTimeout(() => {
                this.connect();
            }, this.reconnectDelay);
        } else {
            console.error('❌ Max reconnection attempts reached');
            this.updateConnectionStatus('disconnected');
        }
    }

    // Event listener system
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }

    trigger(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
        }
    }

    // Update UI connection status
    updateConnectionStatus(status) {
        const statusEl = document.getElementById('connectionStatus');
        if (!statusEl) return;

        statusEl.className = `connection-status ${status}`;

        const statusText = {
            'connecting': 'Connecting...',
            'connected': 'Connected',
            'disconnected': 'Disconnected'
        };

        statusEl.querySelector('.status-text').textContent = statusText[status] || status;

        // Auto-hide when connected
        if (status === 'connected') {
            setTimeout(() => {
                statusEl.classList.add('hidden');
            }, 3000);
        } else {
            statusEl.classList.remove('hidden');
        }
    }

    // Mock event generator for demo
    startMockEvents() {
        // Simulate receiving events every 30-60 seconds
        this.mockInterval = setInterval(() => {
            const eventType = Math.random();

            if (eventType < 0.3) {
                // Context detected
                this.trigger('context_detected', {
                    type: 'context_detected',
                    timestamp: Date.now(),
                    contextDescription: this.getRandomContext(),
                    confidence: 0.75 + Math.random() * 0.2
                });
            } else if (eventType < 0.6) {
                // Trigger reminder
                this.trigger('trigger_reminder', {
                    type: 'trigger_reminder',
                    reminderId: 'reminder_' + Math.floor(Math.random() * 3),
                    reminderTitle: this.getRandomReminderTitle(),
                    contextMatch: this.getRandomContext(),
                    timestamp: Date.now()
                });
            } else {
                // AI insight
                this.trigger('ai_insight', {
                    type: 'ai_insight',
                    suggestion: {
                        id: 'insight_' + Date.now(),
                        type: 'pattern_found',
                        title: 'New Pattern Found',
                        description: this.getRandomInsight(),
                        confidence: 0.8 + Math.random() * 0.15,
                        basedOnEvents: [],
                        suggestedAction: {
                            type: 'create_reminder',
                            title: 'Suggested Reminder',
                            context: 'Automatically generated context based on pattern',
                            priority: 'medium'
                        }
                    }
                });
            }
        }, 45000); // Every 45 seconds
    }

    // Helper: Random context descriptions
    getRandomContext() {
        const contexts = [
            'User is at the supermarket milk aisle',
            'User is working at a cafe',
            'User is working out at the gym',
            'User is on the way home',
            'User is in a meeting at the office',
            'User is dining at a restaurant'
        ];
        return contexts[Math.floor(Math.random() * contexts.length)];
    }

    // Helper: Random reminder titles
    getRandomReminderTitle() {
        const titles = [
            'Buy Milk',
            'Call Mom',
            'Complete Project Report',
            'Drink Water and Rest',
            'Check Email'
        ];
        return titles[Math.floor(Math.random() * titles.length)];
    }

    // Helper: Random insights
    getRandomInsight() {
        const insights = [
            'You often ignore your shopping list at the supermarket, would you like a reminder?',
            'Detected you are at a cafe around 3 PM daily, consider setting a regular reminder',
            'You often forget to call family recently, suggest setting a weekend reminder',
            'Noticed you always forget to hydrate at the gym, would you like to add a reminder?'
        ];
        return insights[Math.floor(Math.random() * insights.length)];
    }

    // Disconnect
    disconnect() {
        if (this.mockInterval) {
            clearInterval(this.mockInterval);
        }
        if (this.ws) {
            this.ws.close();
        }
        this.isConnected = false;
    }
}

// Export global instance
window.wsManager = new WebSocketManager();
