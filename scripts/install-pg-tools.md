# Installing PostgreSQL Tools on Windows

## Option 1: Install PostgreSQL (includes pg_dump)

Download and install PostgreSQL from:
https://www.postgresql.org/download/windows/

During installation, make sure to include "Command Line Tools" or "pgAdmin" (which includes command line tools).

After installation, add PostgreSQL bin directory to PATH:
- Default location: `C:\Program Files\PostgreSQL\<version>\bin`
- Add to PATH in System Environment Variables

## Option 2: Use Chocolatey (Package Manager)

```powershell
# Install Chocolatey first if you don't have it
# Then install PostgreSQL:
choco install postgresql

# Or just the client tools:
choco install postgresql15 --params '/Password:yourpassword'
```

## Option 3: Use Docker (No Installation Needed)

```powershell
# Pull PostgreSQL image
docker pull postgres:15

# Run pg_dump from Docker container
docker run --rm -v ${PWD}:/data postgres:15 pg_dump -h host.docker.internal -U username -d dbname -F c -f /data/dump.dump

# Note: host.docker.internal allows Docker to access your localhost PostgreSQL
```

## Option 4: Use Python Script (No pg_dump needed)

Use the provided `dump-with-python.py` script which uses psycopg2:

```powershell
cd web/scripts
python dump-with-python.py
```

This script will:
1. Install psycopg2-binary if needed
2. Connect to your local PostgreSQL
3. Dump all data to SQL file
4. Restore to Neon
5. Run Drizzle migrations

## Option 5: Use pgAdmin GUI

1. Install pgAdmin from PostgreSQL installer
2. Connect to your local database
3. Right-click database → Backup
4. Save as custom format (.backup)
5. Connect to Neon in pgAdmin
6. Right-click database → Restore
7. Select your backup file

## Quick Test

After installation, test if pg_dump works:

```powershell
pg_dump --version
```

If it shows a version number, you're good to go!




