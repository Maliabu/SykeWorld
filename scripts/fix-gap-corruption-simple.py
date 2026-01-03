import os
import re
import glob

def fix_corrupted_gap_lines(file_path):
    """Fix corrupted className attributes with .Value -replace patterns"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # Simple pattern: match anything between className=" and "> that contains .Value -replace
    # This catches all variations
    pattern = r'className="([^"]*?)\s*<div className="([^"]+?)">\.Value -replace [\'"]gap-2[\'"], [\'"]gap-2[\'"]\s*([^"]*?)"'
    
    def replace_func(match):
        prefix = match.group(1).strip()
        classes = match.group(2).strip()
        suffix = match.group(3).strip()
        
        result = classes
        if prefix:
            result = f"{prefix} {result}"
        if suffix:
            result = f"{result} {suffix}"
        
        return f'className="{result}"'
    
    content = re.sub(pattern, replace_func, content)
    
    # If content changed, write it back
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

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
            if fix_corrupted_gap_lines(file_path):
                fixed_count += 1
                print(f"Fixed: {os.path.relpath(file_path, web_dir)}")
    except Exception as e:
        print(f"Error fixing {file_path}: {e}")

print(f"\nFixed {fixed_count} files")
