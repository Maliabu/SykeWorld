import os
import re
import glob

def fix_corrupted_gap_lines(file_path):
    """Fix corrupted className attributes with .Value -replace patterns"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # More comprehensive pattern that catches all variations
    # Matches: className="[any whitespace]<div className="[classes]">.Value -replace 'gap-2', 'gap-2' [optional extra classes]"
    # This is a catch-all pattern that handles all the variations
    pattern = r'className="\s*<div className="([^"]+)">\.Value -replace [''"]gap-2[''"], [''"]gap-2[''"]\s*([^"]*)"'
    
    def replace_func(match):
        classes = match.group(1)
        extra = match.group(2).strip()
        if extra:
            return f'className="{classes} {extra}"'
        return f'className="{classes}"'
    
    content = re.sub(pattern, replace_func, content)
    
    # Also handle patterns with extra classes after the replace
    pattern2 = r'className="\s*<div className="([^"]+)">\.Value -replace [''"]gap-2[''"], [''"]gap-2[''"]\s+([^"]+)"'
    def replace_func2(match):
        classes = match.group(1)
        extra = match.group(2).strip()
        return f'className="{classes} {extra}"'
    
    content = re.sub(pattern2, replace_func2, content)
    
    # Handle flex-1 patterns
    pattern3 = r'className="flex-1\s*<div className="flex-1 ([^"]+)">\.Value -replace [''"]gap-2[''"], [''"]gap-2[''"]\s*([^"]*)"'
    def replace_func3(match):
        classes = match.group(1)
        extra = match.group(2).strip()
        if extra:
            return f'className="flex-1 {classes} {extra}"'
        return f'className="flex-1 {classes}"'
    
    content = re.sub(pattern3, replace_func3, content)
    
    # Handle flex-1 overflow-y-auto patterns
    pattern4 = r'className="flex-1 overflow-y-auto\s*<div className="flex-1 overflow-y-auto ([^"]+)">\.Value -replace [''"]gap-2[''"], [''"]gap-2[''"]\s*([^"]*)"'
    def replace_func4(match):
        classes = match.group(1)
        extra = match.group(2).strip()
        if extra:
            return f'className="flex-1 overflow-y-auto {classes} {extra}"'
        return f'className="flex-1 overflow-y-auto {classes}"'
    
    content = re.sub(pattern4, replace_func4, content)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    return content

# Find all corrupted files
script_dir = os.path.dirname(os.path.abspath(__file__))
web_dir = os.path.dirname(script_dir)
dashboard_dir = os.path.join(web_dir, "app", "admin", "dashboard")

# Find all .tsx files in dashboard directory
tsx_files = glob.glob(os.path.join(dashboard_dir, "**", "*.tsx"), recursive=True)

fixed_count = 0
for file_path in tsx_files:
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        if '.Value -replace' in content:
            fix_corrupted_gap_lines(file_path)
            fixed_count += 1
            print(f"Fixed: {os.path.relpath(file_path, web_dir)}")
    except Exception as e:
        print(f"Error fixing {file_path}: {e}")

print(f"\nFixed {fixed_count} files")
