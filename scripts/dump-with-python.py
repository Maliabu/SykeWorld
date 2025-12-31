#!/usr/bin/env python3
"""
Database Migration Script: Local PostgreSQL → Neon
Uses psycopg2 to dump and restore data
"""

import os
import sys
import subprocess
from pathlib import Path

def run_command(cmd, description):
    """Run a command and handle errors"""
    print(f"\n{description}...")
    try:
        result = subprocess.run(cmd, shell=True, check=True, capture_output=True, text=True)
        print(f"✓ {description} completed")
        return result.stdout
    except subprocess.CalledProcessError as e:
        print(f"✗ Error: {e.stderr}")
        sys.exit(1)

def main():
    print("=== Database Migration: Local PostgreSQL → Neon ===\n")
    
    # Get local database connection details
    print("Local Database Connection:")
    local_host = input("Host [localhost]: ").strip() or "localhost"
    local_port = input("Port [5432]: ").strip() or "5432"
    local_user = input("Username: ").strip()
    local_db = input("Database name: ").strip()
    local_pass = input("Password: ").strip()
    
    # Get Neon connection string
    print("\nNeon Database Connection:")
    neon_url = input("Neon connection string (postgresql://...): ").strip()
    
    # Create dump file name
    from datetime import datetime
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    dump_file = f"local_dump_{timestamp}.sql"
    
    # Check if psycopg2 is available
    try:
        import psycopg2
        from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
    except ImportError:
        print("\n✗ psycopg2 not found. Installing...")
        print(f"Using Python: {sys.executable}")
        result = subprocess.run(
            [sys.executable, "-m", "pip", "install", "psycopg2-binary", "--user"],
            check=True,
            capture_output=True,
            text=True
        )
        print(result.stdout)
        # Clear module cache and reimport
        import importlib
        if 'psycopg2' in sys.modules:
            del sys.modules['psycopg2']
        import psycopg2
        from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
    
    # Step 1: Dump local database
    print(f"\nStep 1: Dumping local database to {dump_file}...")
    
    try:
        # Connect to local database
        local_conn = psycopg2.connect(
            host=local_host,
            port=local_port,
            user=local_user,
            password=local_pass,
            database=local_db
        )
        local_conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        local_cursor = local_conn.cursor()
        
        # Get all table names
        local_cursor.execute("""
            SELECT tablename FROM pg_tables 
            WHERE schemaname = 'public'
            ORDER BY tablename;
        """)
        tables = [row[0] for row in local_cursor.fetchall()]
        
        print(f"Found {len(tables)} tables")
        
        # Write SQL dump
        with open(dump_file, 'w', encoding='utf-8') as f:
            f.write("-- Database dump\n")
            f.write(f"-- Generated: {datetime.now()}\n\n")
            f.write("BEGIN;\n\n")
            
            # Dump data for each table
            for table in tables:
                print(f"  Dumping table: {table}")
                local_cursor.execute(f"SELECT * FROM {table}")
                rows = local_cursor.fetchall()
                
                if rows:
                    # Get column names
                    local_cursor.execute(f"""
                        SELECT column_name FROM information_schema.columns 
                        WHERE table_name = '{table}' 
                        ORDER BY ordinal_position;
                    """)
                    columns = [row[0] for row in local_cursor.fetchall()]
                    
                    # Write INSERT statements
                    for row in rows:
                        values = []
                        for val in row:
                            if val is None:
                                values.append("NULL")
                            elif isinstance(val, str):
                                val_escaped = val.replace("'", "''")
                                values.append(f"'{val_escaped}'")
                            elif isinstance(val, (int, float)):
                                values.append(str(val))
                            elif isinstance(val, bool):
                                values.append("TRUE" if val else "FALSE")
                            else:
                                val_escaped = str(val).replace("'", "''")
                                values.append(f"'{val_escaped}'")
                        
                        f.write(f"INSERT INTO {table} ({', '.join(columns)}) VALUES ({', '.join(values)});\n")
            
            f.write("\nCOMMIT;\n")
        
        local_cursor.close()
        local_conn.close()
        
        print(f"✓ Dump created: {dump_file}")
        
    except Exception as e:
        print(f"✗ Error dumping database: {e}")
        sys.exit(1)
    
    # Step 2: Restore to Neon
    print(f"\nStep 2: Restoring to Neon...")
    
    try:
        # Parse Neon URL
        from urllib.parse import urlparse
        parsed = urlparse(neon_url)
        
        neon_conn = psycopg2.connect(
            host=parsed.hostname,
            port=parsed.port or 5432,
            user=parsed.username,
            password=parsed.password,
            database=parsed.path.lstrip('/'),
            sslmode='require'
        )
        neon_conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        neon_cursor = neon_conn.cursor()
        
        # Read and execute SQL dump
        with open(dump_file, 'r', encoding='utf-8') as f:
            sql = f.read()
            neon_cursor.execute(sql)
        
        neon_cursor.close()
        neon_conn.close()
        
        print("✓ Data restored to Neon")
        
    except Exception as e:
        print(f"✗ Error restoring to Neon: {e}")
        print("\nNote: You may need to run Drizzle migrations separately.")
        sys.exit(1)
    
    # Step 3: Run Drizzle migrations
    print("\nStep 3: Running Drizzle migrations...")
    web_dir = Path(__file__).parent.parent
    os.chdir(web_dir)
    
    try:
        subprocess.run(["npm", "run", "db:migrate"], check=True)
        print("✓ Migrations completed")
    except subprocess.CalledProcessError:
        print("⚠ Migrations may have warnings (this is normal if schema already exists)")
    
    print(f"\n=== Migration Complete! ===")
    print(f"Dump file saved as: {dump_file}")

if __name__ == "__main__":
    main()

