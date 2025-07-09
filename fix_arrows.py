#!/usr/bin/env python3
"""Fix Unicode arrows in enhanced_maritime_routes.py"""

import os

def fix_unicode_arrows():
    file_path = 'src/ai/enhanced_maritime_routes.py'
    
    # Read the file
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace Unicode arrows with ASCII arrows
    content = content.replace('→', '->')
    
    # Write back the file
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("Fixed Unicode arrows in enhanced_maritime_routes.py")

if __name__ == '__main__':
    fix_unicode_arrows()
