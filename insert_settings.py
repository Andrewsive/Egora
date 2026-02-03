# -*- coding: utf-8 -*-
"""
Safely add settings modal to index.html
This script inserts the settings modal before the closing </body> tag
"""

# Settings modal HTML
settings_modal_html = '''
    <!-- Modal: Settings -->
    <div id="settingsModal" class="modal">
        <div class="modal-overlay"></div>
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title">设置</h3>
                <button class="close-btn" id="closeSettingsBtn">✕</button>
            </div>
            <div class="modal-body">
                <div class="settings-section">
                    <h4 class="settings-subtitle">📦 数据管理</h4>
                    <div class="settings-item">
                        <div class="setting-info">
                            <div class="setting-label">导出数据</div>
                            <div class="setting-description">将所有提醒、时间线和洞察导出为JSON文件</div>
                        </div>
                        <button class="btn btn-primary" id="exportDataBtn">📥 导出</button>
                    </div>
                    <div class="settings-item">
                        <div class="setting-info">
                            <div class="setting-label">导入数据</div>
                            <div class="setting-description">从JSON文件恢复数据</div>
                        </div>
                        <label class="btn btn-secondary" for="importDataInput">
                            📤 导入
                            <input type="file" id="importDataInput" accept=".json" style="display: none;">
                        </label>
                    </div>
                    <div class="settings-item">
                        <div class="setting-info">
                            <div class="setting-label">清除所有数据</div>
                            <div class="setting-description">删除所有本地数据（不可恢复）</div>
                        </div>
                        <button class="btn btn-danger" id="clearDataBtn">🗑️ 清除</button>
                    </div>
                </div>
                <div class="settings-section">
                    <h4 class="settings-subtitle">ℹ️ 关于</h4>
                    <div class="settings-item">
                        <div class="setting-info">
                            <div class="setting-label">版本信息</div>
                            <div class="setting-description">情境提醒系统 v1.0.0</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

'''

# Read the file
filepath = r'C:\Users\陈奕辰\Documents\Egora\index.html'
with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find the line with <!-- Scripts --> and insert before it
new_lines = []
inserted = False

for i, line in enumerate(lines):
    # Insert before the scripts section
    if '<!-- Scripts -->' in line and not inserted:
        new_lines.append(settings_modal_html)
        inserted = True
    new_lines.append(line)

# Also ensure data-manager.js is included
has_data_manager = any('data-manager.js' in line for line in new_lines)
if not has_data_manager:
    # Find the line with app.js and insert data-manager before it
    final_lines = []
    for line in new_lines:
        if '<script src="app.js"></script>' in line:
            final_lines.append('    <script src="modules/data-manager.js"></script>\n')
        final_lines.append(line)
    new_lines = final_lines

# Write back
with open(filepath, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print(f"✅ Settings modal added: {inserted}")
print(f"✅ data-manager.js included: {has_data_manager or 'Added'}")
print(f"Total lines: {len(new_lines)}")
