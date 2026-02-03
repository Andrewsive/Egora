# -*- coding: utf-8 -*-
import re

# Read the HTML file
with open(r'C:\Users\陈奕辰\Documents\Egora\index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Settings modal HTML
settings_modal = '''
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

# Insert before the eventModal
if 'settingsModal' not in content:
    content = re.sub(
        r'(    <!-- Modal: Event Details -->)',
        settings_modal + r'\1',
        content
    )
    
    # Write back
    with open(r'C:\Users\陈奕辰\Documents\Egora\index.html', 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("Settings modal added successfully!")
else:
    print("Settings modal already exists!")
