// ===================================
// Storage Module - IndexedDB & LocalStorage
// ===================================

class StorageManager {
    constructor() {
        this.dbName = 'ContextReminderDB';
        this.dbVersion = 1;
        this.db = null;
    }

    // Initialize IndexedDB
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Timeline Events Store
                if (!db.objectStoreNames.contains('timeline')) {
                    const timelineStore = db.createObjectStore('timeline', { keyPath: 'id' });
                    timelineStore.createIndex('timestamp', 'timestamp', { unique: false });
                    timelineStore.createIndex('type', 'type', { unique: false });
                }

                // Reminder Rules Store
                if (!db.objectStoreNames.contains('reminders')) {
                    const remindersStore = db.createObjectStore('reminders', { keyPath: 'id' });
                    remindersStore.createIndex('enabled', 'enabled', { unique: false });
                    remindersStore.createIndex('priority', 'priority', { unique: false });
                }

                // Insights Store
                if (!db.objectStoreNames.contains('insights')) {
                    const insightsStore = db.createObjectStore('insights', { keyPath: 'id' });
                    insightsStore.createIndex('type', 'type', { unique: false });
                }
            };
        });
    }

    // Generic CRUD Operations
    async add(storeName, data) {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        return new Promise((resolve, reject) => {
            const request = store.add(data);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async get(storeName, id) {
        const transaction = this.db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        return new Promise((resolve, reject) => {
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAll(storeName, indexName = null, query = null) {
        const transaction = this.db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const source = indexName ? store.index(indexName) : store;
        
        return new Promise((resolve, reject) => {
            const request = query ? source.getAll(query) : source.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }


    // Update or insert (upsert) - overwrites if ID exists
    async upsert(storeName, data) {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        return new Promise((resolve, reject) => {
            const request = store.put(data);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async update(storeName, data) {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        return new Promise((resolve, reject) => {
            const request = store.put(data);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async delete(storeName, id) {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        return new Promise((resolve, reject) => {
            const request = store.delete(id);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // Timeline specific methods
    async getTimelineEvents(limit = 50) {
        const events = await this.getAll('timeline');
        return events.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
    }

    async addTimelineEvent(event) {
        return await this.add('timeline', event);
    }

    // Reminders specific methods
    async getReminders() {
        return await this.getAll('reminders');
    }

    async addReminder(reminder) {
        return await this.add('reminders', reminder);
    }

    async updateReminder(reminder) {
        return await this.update('reminders', reminder);
    }

    async deleteReminder(id) {
        return await this.delete('reminders', id);
    }

    // Insights specific methods
    async getInsights() {
        return await this.getAll('insights');
    }

    async addInsight(insight) {
        return await this.add('insights', insight);
    }

    async deleteInsight(id) {
        return await this.delete('insights', id);
    }

    // LocalStorage helpers
    setLocal(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    getLocal(key, defaultValue = null) {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : defaultValue;
    }

    removeLocal(key) {
        localStorage.removeItem(key);
    }
}

// Export global instance
window.storageManager = new StorageManager();
