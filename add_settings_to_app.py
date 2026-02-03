# -*- coding: utf-8 -*-
"""
Add settings panel functionality to app.js
"""

filepath = r'C:\Users\陈奕辰\Documents\Egora\app.js'

# Read the file
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add setupSettings call in init method
# Find the line with "this.setupModals();" and add setupSettings after it
setup_settings_call = '''// Setup settings panel
            this.setupSettings();
            console.log('✅ Settings setup complete');

'''

if 'setupSettings' not in content:
    content = content.replace(
        "// Setup modal event listeners\n            this.setupModals();\n            console.log('✅ Modals setup complete');",
        "// Setup modal event listeners\n            this.setupModals();\n            console.log('✅ Modals setup complete');\n\n            " + setup_settings_call.strip()
    )

# 2. Replace settings button placeholder with real functionality
content = content.replace(
    '''// Settings button (placeholder)
        document.getElementById('settingsBtn')?.addEventListener('click', () => {
            window.showToast('设置功能即将推出');
        });''',
    '''// Settings button
        document.getElementById('settingsBtn')?.addEventListener('click', () => {
            const modal = document.getElementById('settingsModal');
            modal?.classList.add('active');
        });'''
)

# 3. Add setupSettings method before getDeviceId method
setup_settings_method = '''
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

'''

if 'setupSettings()' not in content:
    # Insert before getDeviceId method
    content = content.replace(
        '    // Get device ID (or generate one)',
        setup_settings_method + '    // Get device ID (or generate one)'
    )

# Write back
with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Settings functionality added to app.js")
print("✅ Using correct method names: loadEvents, loadReminders, loadInsights")
