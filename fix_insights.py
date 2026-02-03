# -*- coding: utf-8 -*-
"""
Fix insights.js to validate insight objects before rendering
"""

filepath = r'C:\Users\陈奕辰\Documents\Egora\modules\insights.js'

# Read the file
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Find and replace the loadInsights method
old_load_insights = '''    // Load insights from storage
    async loadInsights() {
        try {
            this.insights = await window.storageManager.getInsights();

            // If no insights, create demo data (only on first load)
            const hasInteracted = window.storageManager.getLocal('insights_interacted', false);
            if (this.insights.length === 0 && !hasInteracted) {
                await this.createDemoData();
                this.insights = await window.storageManager.getInsights();
            }
        } catch (error) {
            console.error('Error loading insights:', error);
            this.insights = [];
        }
    }'''

new_load_insights = '''    // Load insights from storage
    async loadInsights() {
        try {
            let insights = await window.storageManager.getInsights();
            
            // Filter out invalid insights (must have id, type, title, description, confidence)
            this.insights = insights.filter(insight => {
                const isValid = insight && 
                               insight.id && 
                               insight.type && 
                               insight.title && 
                               insight.description && 
                               typeof insight.confidence === 'number';
                
                if (!isValid) {
                    console.warn('Invalid insight found and filtered out:', insight);
                }
                return isValid;
            });

            // If no insights, create demo data (only on first load)
            const hasInteracted = window.storageManager.getLocal('insights_interacted', false);
            if (this.insights.length === 0 && !hasInteracted) {
                await this.createDemoData();
                insights = await window.storageManager.getInsights();
                // Filter again after loading demo data
                this.insights = insights.filter(insight => {
                    return insight && insight.id && insight.type && insight.title && 
                           insight.description && typeof insight.confidence === 'number';
                });
            }
        } catch (error) {
            console.error('Error loading insights:', error);
            this.insights = [];
        }
    }'''

if old_load_insights in content:
    content = content.replace(old_load_insights, new_load_insights)
    print("✅ loadInsights method updated with validation")
else:
    print("⚠️ Could not find exact match for loadInsights, trying alternative...")
    # Alternative: just add filtering before the check
    content = content.replace(
        'this.insights = await window.storageManager.getInsights();',
        '''let insights = await window.storageManager.getInsights();
            
            // Filter out invalid insights
            this.insights = insights.filter(insight => {
                return insight && insight.id && insight.type && insight.title && 
                       insight.description && typeof insight.confidence === 'number';
            });''',
        1  # Only replace first occurrence
    )
    print("✅ Added validation using alternative method")

# Write back
with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ insights.js updated successfully")
