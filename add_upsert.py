# -*- coding: utf-8 -*-
"""
Add upsert method to storage.js and update data-manager to use it
"""

import re

# 1. Add upsert method to storage.js
storage_path = r'C:\Users\陈奕辰\Documents\Egora\modules\storage.js'

with open(storage_path, 'r', encoding='utf-8') as f:
    storage_content = f.read()

# Add upsert method after add method
upsert_method = '''
    // Update or insert (upsert) - overwrites if ID exists
    async upsert(storeName, data) {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        return new Promise((resolve, reject) => {
            const request = store.put(data);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }'''

if 'async upsert' not in storage_content:
    # Find the position after add method
    add_method_end = storage_content.find('    async update(storeName')
    if add_method_end != -1:
        storage_content = storage_content[:add_method_end] + upsert_method + '\n\n' + storage_content[add_method_end:]
        
        with open(storage_path, 'w', encoding='utf-8') as f:
            f.write(storage_content)
        print("✅ Added upsert method to storage.js")
    else:
        print("❌ Could not find insertion point in storage.js")
else:
    print("✅ upsert method already exists in storage.js")

# 2. Update data-manager.js to use upsert instead of add
data_manager_path = r'C:\Users\陈奕辰\Documents\Egora\modules\data-manager.js'

with open(data_manager_path, 'r', encoding='utf-8') as f:
    dm_content = f.read()

# Replace addReminder with upsert
dm_content = dm_content.replace(
    'await window.storageManager.addReminder(reminder);',
    'await window.storageManager.upsert(\'reminders\', reminder);'
)

dm_content = dm_content.replace(
    'await window.storageManager.addTimelineEvent(event);',
    'await window.storageManager.upsert(\'timeline\', event);'
)

dm_content = dm_content.replace(
    'await window.storageManager.addInsight(insight);',
    'await window.storageManager.upsert(\'insights\', insight);'
)

with open(data_manager_path, 'w', encoding='utf-8') as f:
    f.write(dm_content)

print("✅ Updated data-manager.js to use upsert")
print("✅ Import will now overwrite existing data with same ID")
