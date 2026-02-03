# -*- coding: utf-8 -*-
"""Fix HTML encoding issues"""

# Read with correct encoding
with open(r'C:\Users\陈奕辰\Documents\Egora\index.html', 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

# Write back with UTF-8 BOM to ensure proper encoding
with open(r'C:\Users\陈奕辰\Documents\Egora\index.html', 'w', encoding='utf-8-sig') as f:
    f.write(content)

print("Encoding fixed! File saved as UTF-8 with BOM")
