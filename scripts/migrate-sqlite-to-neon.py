#!/usr/bin/env python3
"""
Migrate data from SQLite (Django) to Neon PostgreSQL (Drizzle)
"""

import sqlite3
import sys
import os
from pathlib import Path
from datetime import datetime
import uuid

def generate_uuid():
    """Generate a UUID string"""
    return str(uuid.uuid4())

def migrate_data():
    print("=== SQLite to Neon PostgreSQL Migration ===\n")
    
    # Get SQLite database path
    api_dir = Path(__file__).parent.parent.parent / "api"
    sqlite_path = api_dir / "db.sqlite3"
    
    if not sqlite_path.exists():
        print(f"✗ SQLite database not found at: {sqlite_path}")
        print("Please provide the path to your SQLite database:")
        sqlite_path = Path(input("SQLite database path: ").strip())
        if not sqlite_path.exists():
            print("✗ File not found!")
            sys.exit(1)
    
    print(f"✓ Found SQLite database: {sqlite_path}\n")
    
    # Get Neon connection string
    print("Neon Database Connection:")
    neon_url = input("Neon connection string (postgresql://user:password@host:5432/dbname?sslmode=require): ").strip()
    
    if not neon_url:
        print("✗ Neon connection string is required!")
        sys.exit(1)
    
    # Install psycopg2 if needed
    try:
        import psycopg2
        from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
    except ImportError:
        print("\nInstalling psycopg2-binary...")
        import subprocess
        subprocess.run([sys.executable, "-m", "pip", "install", "psycopg2-binary", "--user"], check=True)
        import psycopg2
        from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
    
    # Connect to SQLite
    print("\nStep 1: Connecting to SQLite database...")
    sqlite_conn = sqlite3.connect(sqlite_path)
    sqlite_conn.row_factory = sqlite3.Row
    sqlite_cursor = sqlite_conn.cursor()
    
    # Connect to Neon PostgreSQL
    print("Step 2: Connecting to Neon PostgreSQL...")
    from urllib.parse import urlparse
    parsed = urlparse(neon_url)
    
    neon_conn = psycopg2.connect(
        host=parsed.hostname,
        port=parsed.port or 5432,
        user=parsed.username,
        password=parsed.password,
        database=parsed.path.lstrip('/').split('?')[0],
        sslmode='require'
    )
    neon_conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    neon_cursor = neon_conn.cursor()
    
    print("✓ Connected to both databases\n")
    
    # Create ID mapping dictionaries
    id_maps = {
        'users': {},
        'room_types': {},
        'rooms': {},
        'bookings': {},
        'room_services': {},
        'gallery_categories': {},
        'payments': {},
        'transactions': {},
        'roles': {},
        'staff_profiles': {},
        'task_statuses': {},
        'staff_tasks': {},
    }
    
    # Helper function to safely get value from Row
    def get_row_value(row, key, default=None):
        """Safely get value from sqlite3.Row"""
        try:
            value = row[key]
            return value if value is not None else default
        except (KeyError, IndexError):
            return default
    
    # Migration functions for each table
    def migrate_users():
        print("Migrating users...")
        sqlite_cursor.execute("SELECT * FROM accounts_customuser")
        users = sqlite_cursor.fetchall()
        
        for user in users:
            new_id = generate_uuid()
            old_id = get_row_value(user, 'id')
            id_maps['users'][old_id] = new_id
            
            # Map user_type
            user_type = get_row_value(user, 'user_type', 'guest')
            if user_type not in ['guest', 'staff']:
                user_type = 'guest'
            
            # Map gender
            gender = get_row_value(user, 'gender')
            if gender and gender not in ['male', 'female']:
                gender = None
            
            try:
                neon_cursor.execute("""
                    INSERT INTO users (
                        id, email, username, password, first_name, last_name,
                        user_type, phone, gender, address, profile_picture,
                        birth_date, is_verified, is_disabled, is_active,
                        is_staff, is_superuser, date_joined, last_login, created
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    new_id,
                    get_row_value(user, 'email', ''),
                    get_row_value(user, 'username', ''),
                    get_row_value(user, 'password', ''),
                    get_row_value(user, 'first_name'),
                    get_row_value(user, 'last_name'),
                    user_type,
                    get_row_value(user, 'phone'),
                    gender,
                    get_row_value(user, 'address'),
                    get_row_value(user, 'profile_picture', 'default.jpg'),
                    get_row_value(user, 'birth_date'),
                    bool(get_row_value(user, 'is_verified', False)),
                    bool(get_row_value(user, 'is_disabled', False)),
                    bool(get_row_value(user, 'is_active', True)),
                    bool(get_row_value(user, 'is_staff', False)),
                    bool(get_row_value(user, 'is_superuser', False)),
                    get_row_value(user, 'date_joined') or datetime.now(),
                    get_row_value(user, 'last_login'),
                    get_row_value(user, 'created') or datetime.now(),
                ))
            except Exception as e:
                email = get_row_value(user, 'email', 'unknown')
                print(f"  ⚠ Error inserting user {email}: {e}")
        
        print(f"  ✓ Migrated {len(users)} users")
    
    def migrate_room_services():
        print("Migrating room services...")
        sqlite_cursor.execute("SELECT * FROM bookings_roomservice")
        services = sqlite_cursor.fetchall()
        
        for service in services:
            new_id = generate_uuid()
            old_id = get_row_value(service, 'id')
            id_maps['room_services'][old_id] = new_id
            
            try:
                neon_cursor.execute("""
                    INSERT INTO room_services (id, name, description, icon)
                    VALUES (%s, %s, %s, %s)
                """, (
                    new_id,
                    get_row_value(service, 'name', ''),
                    get_row_value(service, 'description'),
                    get_row_value(service, 'icon'),
                ))
            except Exception as e:
                print(f"  ⚠ Error inserting service {get_row_value(service, 'name', 'unknown')}: {e}")
        
        print(f"  ✓ Migrated {len(services)} room services")
    
    def migrate_room_types():
        print("Migrating room types...")
        sqlite_cursor.execute("SELECT * FROM bookings_roomtype")
        room_types = sqlite_cursor.fetchall()
        
        for rt in room_types:
            new_id = generate_uuid()
            old_id = get_row_value(rt, 'id')
            id_maps['room_types'][old_id] = new_id
            
            try:
                neon_cursor.execute("""
                    INSERT INTO room_types (id, name, description, base_price, max_guests, created)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """, (
                    new_id,
                    get_row_value(rt, 'name', ''),
                    get_row_value(rt, 'description'),
                    str(get_row_value(rt, 'base_price', 0)),
                    get_row_value(rt, 'max_guests', 2),
                    get_row_value(rt, 'created') or datetime.now(),
                ))
                
                # Migrate room type services (many-to-many)
                sqlite_cursor.execute("""
                    SELECT roomservice_id FROM bookings_roomtype_room_service
                    WHERE roomtype_id = ?
                """, (old_id,))
                service_ids = sqlite_cursor.fetchall()
                
                for service_row in service_ids:
                    old_service_id = service_row[0]
                    if old_service_id in id_maps['room_services']:
                        new_service_id = id_maps['room_services'][old_service_id]
                        try:
                            neon_cursor.execute("""
                                INSERT INTO room_type_services (id, room_type_id, room_service_id)
                                VALUES (%s, %s, %s)
                            """, (generate_uuid(), new_id, new_service_id))
                        except:
                            pass  # Skip if already exists
            except Exception as e:
                print(f"  ⚠ Error inserting room type {get_row_value(rt, 'name', 'unknown')}: {e}")
        
        print(f"  ✓ Migrated {len(room_types)} room types")
    
    def migrate_rooms():
        print("Migrating rooms...")
        sqlite_cursor.execute("SELECT * FROM bookings_room")
        rooms = sqlite_cursor.fetchall()
        
        for room in rooms:
            new_id = generate_uuid()
            old_id = get_row_value(room, 'id')
            id_maps['rooms'][old_id] = new_id
            
            # Map room type
            old_room_type_id = get_row_value(room, 'room_type_id')
            new_room_type_id = id_maps['room_types'].get(old_room_type_id)
            
            if not new_room_type_id:
                room_num = get_row_value(room, 'room_number', 'unknown')
                print(f"  ⚠ Skipping room {room_num} - room type not found")
                continue
            
            # Map status
            status = get_row_value(room, 'status', 'available')
            if status not in ['available', 'occupied', 'cleaning', 'maintenance', 'unavailable']:
                status = 'available'
            
            try:
                neon_cursor.execute("""
                    INSERT INTO rooms (id, room_number, room_type_id, floor, status, created)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """, (
                    new_id,
                    get_row_value(room, 'room_number', ''),
                    new_room_type_id,
                    get_row_value(room, 'floor', 1),
                    status,
                    get_row_value(room, 'created') or datetime.now(),
                ))
                
                # Migrate room images
                sqlite_cursor.execute("""
                    SELECT * FROM bookings_roomimage WHERE room_id = ?
                """, (old_id,))
                images = sqlite_cursor.fetchall()
                
                for img in images:
                    try:
                        neon_cursor.execute("""
                            INSERT INTO room_images (id, room_id, image, caption)
                            VALUES (%s, %s, %s, %s)
                        """, (
                            generate_uuid(),
                            new_id,
                            get_row_value(img, 'image', ''),
                            get_row_value(img, 'caption'),
                        ))
                    except:
                        pass
            except Exception as e:
                room_num = get_row_value(room, 'room_number', 'unknown')
                print(f"  ⚠ Error inserting room {room_num}: {e}")
        
        print(f"  ✓ Migrated {len(rooms)} rooms")
    
    def migrate_bookings():
        print("Migrating bookings...")
        sqlite_cursor.execute("SELECT * FROM bookings_booking")
        bookings = sqlite_cursor.fetchall()
        
        for booking in bookings:
            new_id = generate_uuid()
            old_id = get_row_value(booking, 'id')
            id_maps['bookings'][old_id] = new_id
            
            # Map user and room
            old_user_id = get_row_value(booking, 'user_id')
            old_room_id = get_row_value(booking, 'room_id')
            
            new_user_id = id_maps['users'].get(old_user_id)
            new_room_id = id_maps['rooms'].get(old_room_id)
            
            if not new_user_id or not new_room_id:
                print(f"  ⚠ Skipping booking {old_id} - user or room not found")
                continue
            
            # Map status
            status = get_row_value(booking, 'status', 'pending')
            if status not in ['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled']:
                status = 'pending'
            
            try:
                neon_cursor.execute("""
                    INSERT INTO bookings (
                        id, user_id, room_id, check_in, check_out,
                        guests, special_requests, total_price, status, created
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    new_id,
                    new_user_id,
                    new_room_id,
                    get_row_value(booking, 'check_in'),
                    get_row_value(booking, 'check_out'),
                    get_row_value(booking, 'guests', 1),
                    get_row_value(booking, 'special_requests'),
                    str(get_row_value(booking, 'total_price', 0)),
                    status,
                    get_row_value(booking, 'created') or datetime.now(),
                ))
            except Exception as e:
                print(f"  ⚠ Error inserting booking {old_id}: {e}")
        
        print(f"  ✓ Migrated {len(bookings)} bookings")
    
    def migrate_reviews():
        print("Migrating room reviews...")
        sqlite_cursor.execute("SELECT * FROM bookings_roomreview")
        reviews = sqlite_cursor.fetchall()
        
        for review in reviews:
            old_user_id = get_row_value(review, 'user_id')
            old_room_id = get_row_value(review, 'room_id')
            
            new_user_id = id_maps['users'].get(old_user_id)
            new_room_id = id_maps['rooms'].get(old_room_id)
            
            if not new_user_id or not new_room_id:
                continue
            
            try:
                neon_cursor.execute("""
                    INSERT INTO room_reviews (id, room_id, user_id, stars, comment, created)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """, (
                    generate_uuid(),
                    new_room_id,
                    new_user_id,
                    get_row_value(review, 'stars', 5),
                    get_row_value(review, 'comment'),
                    get_row_value(review, 'created') or datetime.now(),
                ))
            except Exception as e:
                print(f"  ⚠ Error inserting review: {e}")
        
        print(f"  ✓ Migrated {len(reviews)} reviews")
    
    def migrate_contact_messages():
        print("Migrating contact messages...")
        sqlite_cursor.execute("SELECT * FROM accounts_contactmessage")
        messages = sqlite_cursor.fetchall()
        
        for msg in messages:
            try:
                neon_cursor.execute("""
                    INSERT INTO contact_messages (id, name, email, message, created)
                    VALUES (%s, %s, %s, %s, %s)
                """, (
                    generate_uuid(),
                    get_row_value(msg, 'name', ''),
                    get_row_value(msg, 'email', ''),
                    get_row_value(msg, 'message', ''),
                    get_row_value(msg, 'created') or datetime.now(),
                ))
            except Exception as e:
                print(f"  ⚠ Error inserting message: {e}")
        
        print(f"  ✓ Migrated {len(messages)} contact messages")
    
    def migrate_subscriptions():
        print("Migrating subscriptions...")
        sqlite_cursor.execute("SELECT * FROM bookings_subscription")
        subscriptions = sqlite_cursor.fetchall()
        
        for sub in subscriptions:
            try:
                neon_cursor.execute("""
                    INSERT INTO subscriptions (id, name, email, created)
                    VALUES (%s, %s, %s, %s)
                """, (
                    generate_uuid(),
                    get_row_value(sub, 'name', ''),
                    get_row_value(sub, 'email', ''),
                    get_row_value(sub, 'created') or datetime.now(),
                ))
            except Exception as e:
                print(f"  ⚠ Error inserting subscription: {e}")
        
        print(f"  ✓ Migrated {len(subscriptions)} subscriptions")
    
    def migrate_gallery():
        print("Migrating gallery...")
        # Categories
        sqlite_cursor.execute("SELECT * FROM bookings_gallerycategory")
        categories = sqlite_cursor.fetchall()
        
        for cat in categories:
            new_id = generate_uuid()
            old_id = get_row_value(cat, 'id')
            id_maps['gallery_categories'][old_id] = new_id
            
            try:
                neon_cursor.execute("""
                    INSERT INTO gallery_categories (id, name, description)
                    VALUES (%s, %s, %s)
                """, (
                    new_id,
                    get_row_value(cat, 'name', ''),
                    get_row_value(cat, 'description'),
                ))
            except Exception as e:
                print(f"  ⚠ Error inserting category: {e}")
        
        # Images
        sqlite_cursor.execute("SELECT * FROM bookings_galleryimage")
        images = sqlite_cursor.fetchall()
        
        for img in images:
            old_cat_id = get_row_value(img, 'category_id')
            new_cat_id = id_maps['gallery_categories'].get(old_cat_id)
            
            if not new_cat_id:
                continue
            
            try:
                neon_cursor.execute("""
                    INSERT INTO gallery_images (id, category_id, image, caption, created)
                    VALUES (%s, %s, %s, %s, %s)
                """, (
                    generate_uuid(),
                    new_cat_id,
                    get_row_value(img, 'image', ''),
                    get_row_value(img, 'caption'),
                    get_row_value(img, 'created') or datetime.now(),
                ))
            except Exception as e:
                print(f"  ⚠ Error inserting gallery image: {e}")
        
        print(f"  ✓ Migrated {len(categories)} categories and {len(images)} images")
    
    def migrate_payments():
        print("Migrating payments...")
        sqlite_cursor.execute("SELECT * FROM payments_payment")
        payments = sqlite_cursor.fetchall()
        
        for payment in payments:
            old_booking_id = get_row_value(payment, 'booking_id')
            old_user_id = get_row_value(payment, 'user_id')
            
            new_booking_id = id_maps['bookings'].get(old_booking_id)
            new_user_id = id_maps['users'].get(old_user_id)
            
            if not new_booking_id or not new_user_id:
                continue
            
            try:
                neon_cursor.execute("""
                    INSERT INTO payments (
                        id, booking_id, user_id, pesapal_order_tracking_id,
                        pesapal_merchant_reference, amount, status, created
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    generate_uuid(),
                    new_booking_id,
                    new_user_id,
                    get_row_value(payment, 'pesapal_order_tracking_id'),
                    get_row_value(payment, 'pesapal_merchant_reference'),
                    str(get_row_value(payment, 'amount', 0)),
                    get_row_value(payment, 'status', 'PENDING'),
                    get_row_value(payment, 'created') or datetime.now(),
                ))
            except Exception as e:
                print(f"  ⚠ Error inserting payment: {e}")
        
        print(f"  ✓ Migrated {len(payments)} payments")
    
    # Run migrations in order
    print("\n=== Starting Migration ===\n")
    
    try:
        migrate_users()
        migrate_room_services()
        migrate_room_types()
        migrate_rooms()
        migrate_bookings()
        migrate_reviews()
        migrate_contact_messages()
        migrate_subscriptions()
        migrate_gallery()
        migrate_payments()
        
        print("\n=== Migration Complete! ===")
        print("\nNext step: Run Drizzle migrations to ensure schema is aligned:")
        print("  cd web")
        print("  npm run db:migrate")
        
    except Exception as e:
        print(f"\n✗ Migration failed: {e}")
        import traceback
        traceback.print_exc()
    finally:
        sqlite_conn.close()
        neon_conn.close()

if __name__ == "__main__":
    migrate_data()

