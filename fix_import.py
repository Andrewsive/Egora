# -*- coding: utf-8 -*-
"""
Fix data-manager.js import function to avoid IndexedDB connection closing issues
"""

filepath = r'C:\Users\陈奕辰\Documents\Egora\modules\data-manager.js'

# New import implementation
new_import_method = '''    // Import data from JSON file
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
                    await window.storageManager.addReminder(reminder);
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
                    await window.storageManager.addTimelineEvent(event);
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
                    await window.storageManager.addInsight(insight);
                    imported.insights++;
                } catch (error) {
                    console.warn('Failed to import insight:', insight.id, error);
                }
            }
        }
        
        return imported;
    }'''

# Read the file
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Find the start and end of the importData method
import_start = content.find('    // Import data from JSON file')
import_end = content.find('    // Clear all data')

if import_start != -1 and import_end != -1:
    # Replace the method
    new_content = content[:import_start] + new_import_method + '\n\n' + content[import_end:]
    
    # Write back
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print("✅ importData method fixed!")
    print("✅ Removed nested async in Promise")
    print("✅ Proper await handling for IndexedDB")
else:
    print("❌ Could not find importData method boundaries")

