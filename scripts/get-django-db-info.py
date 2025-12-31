#!/usr/bin/env python3
"""
Extract database connection info from Django settings
"""

import os
import sys
from pathlib import Path

# Add api directory to path
api_dir = Path(__file__).parent.parent.parent / "api"
sys.path.insert(0, str(api_dir))

# Set Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'api.settings')

try:
    import django
    django.setup()
    
    from django.conf import settings
    
    print("=== Django Database Configuration ===\n")
    
    db_config = settings.DATABASES.get('default', {})
    
    print(f"Engine: {db_config.get('ENGINE', 'Not set')}")
    print(f"Name: {db_config.get('NAME', 'Not set')}")
    print(f"User: {db_config.get('USER', 'Not set')}")
    print(f"Password: {'***' if db_config.get('PASSWORD') else 'Not set'}")
    print(f"Host: {db_config.get('HOST', 'Not set (defaults to localhost)')}")
    print(f"Port: {db_config.get('PORT', 'Not set (defaults to 5432)')}")
    
    # Try to construct connection string
    if db_config.get('ENGINE') == 'django.db.backends.postgresql':
        host = db_config.get('HOST') or 'localhost'
        port = db_config.get('PORT') or '5432'
        name = db_config.get('NAME', '')
        user = db_config.get('USER', '')
        password = db_config.get('PASSWORD', '')
        
        if name and user:
            conn_string = f"postgresql://{user}:{password}@{host}:{port}/{name}"
            print(f"\nConnection String:")
            print(f"postgresql://{user}:***@{host}:{port}/{name}")
            print(f"\n(Use this in the migration script)")
    
except Exception as e:
    print(f"Error: {e}")
    print("\nTrying to read .env file directly...")
    
    env_file = api_dir / ".env"
    if env_file.exists():
        print(f"\nFound .env file at: {env_file}")
        print("\nPlease check this file for database connection details:")
        print("Look for variables like:")
        print("  - DATABASE_URL")
        print("  - DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD")
        print("  - POSTGRES_HOST, POSTGRES_PORT, etc.")
    else:
        print(f"\n.env file not found at: {env_file}")




