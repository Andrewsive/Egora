// ===================================
// Data Manager - Export/Import/Clear
// ===================================

class DataManager {
    // Export all data as JSON
    async exportData() {
        const data = {
            version: '1.0.0',
            exportDate: new Date().toISOString(),
            reminders: await window.storageManager.getReminders(),
            timeline: await window.storageManager.getTimelineEvents(1000), // Export more events
            insights: await window.storageManager.getInsights()
        };

        // Create download
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `context-reminder-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        return data;
    }

    // Import data from JSON file
    async importData(file) {
        const reader = new FileReader();
        
        // Read file as text
        const fileContent = await new Promise((resolve, reject) => {
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(reader.error);
            reader.readAsText(file);
        });
        
        // Parse JSON
        const data = JSON.parse(fileContent);
        
        if (!data || !data.version) {
            throw new Error('Invalid data format');
        }
        
        let imported = { reminders: 0, timeline: 0, insights: 0 };
        
        // Import reminders
        if (data.reminders && Array.isArray(data.reminders)) {
            for (const reminder of data.reminders) {
                try {
                    await window.storageManager.upsert('reminders', reminder);
                    imported.reminders++;
                } catch (error) {
                    console.warn('Failed to import reminder:', reminder.id, error);
                }
            }
        }
        
        // Import timeline events
        if (data.timeline && Array.isArray(data.timeline)) {
            for (const event of data.timeline) {
                try {
                    await window.storageManager.upsert('timeline', event);
                    imported.timeline++;
                } catch (error) {
                    console.warn('Failed to import timeline event:', event.id, error);
                }
            }
        }
        
        // Import insights
        if (data.insights && Array.isArray(data.insights)) {
            for (const insight of data.insights) {
                try {
                    await window.storageManager.upsert('insights', insight);
                    imported.insights++;
                } catch (error) {
                    console.warn('Failed to import insight:', insight.id, error);
                }
            }
        }
        
        return imported;
    }

    // Clear all data
    async clearAllData() {
        // Close DB connection
        if (window.storageManager.db) {
            window.storageManager.db.close();
        }

        // Delete database
        await new Promise((resolve, reject) => {
            const request = indexedDB.deleteDatabase(window.storageManager.dbName);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });

        // Clear localStorage
        localStorage.clear();

        // Reinitialize storage
        await window.storageManager.init();
    }
}

// Export global instance
window.dataManager = new DataManager();
