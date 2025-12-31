# Database Migration Script: Local PostgreSQL → Neon

## Step 1: Dump Local PostgreSQL Database

Run this command to dump your local PostgreSQL database:

```bash
# Replace with your local database credentials
pg_dump -h localhost -U your_username -d your_database_name -F c -f local_dump.dump

# Or if you need to specify port:
pg_dump -h localhost -p 5432 -U your_username -d your_database_name -F c -f local_dump.dump

# Or use connection string format:
pg_dump "postgresql://username:password@localhost:5432/database_name" -F c -f local_dump.dump
```

**Options:**
- `-F c` = Custom format (compressed, best for restoration)
- `-f local_dump.dump` = Output file name
- `-h localhost` = Host (default is localhost)
- `-p 5432` = Port (default is 5432)
- `-U username` = Username
- `-d database_name` = Database name

## Step 2: Restore to Neon

```bash
# Restore the dump to Neon
pg_restore -d "postgresql://neon_user:neon_password@neon_host:5432/neon_database?sslmode=require" --verbose --clean --no-acl --no-owner local_dump.dump

# Or using connection string:
pg_restore "postgresql://neon_user:neon_password@neon_host:5432/neon_database?sslmode=require" --verbose --clean --no-acl --no-owner local_dump.dump
```

**Options:**
- `--verbose` = Show progress
- `--clean` = Drop existing objects before creating
- `--no-acl` = Don't restore access privileges
- `--no-owner` = Don't restore ownership

## Step 3: Run Drizzle Migrations

After restoring, run Drizzle migrations to align schema:

```bash
cd web
npm run db:migrate
```

## Alternative: Data-Only Migration

If you only want to migrate data (not schema), use data-only dump:

```bash
# Dump only data
pg_dump -h localhost -U your_username -d your_database_name -F c -a -f data_only.dump

# Restore only data
pg_restore -d "postgresql://neon_user:neon_password@neon_host:5432/neon_database?sslmode=require" --verbose --data-only --no-acl --no-owner data_only.dump
```

## Important Notes

1. **Schema Differences**: Your Django schema uses integer IDs, but Drizzle uses UUID text IDs. You may need to:
   - Transform the data to match the new schema
   - Or adjust the Drizzle schema to use integer IDs

2. **Table Names**: Django uses lowercase with underscores. Drizzle schema should match.

3. **Foreign Keys**: Make sure all foreign key relationships are preserved.

4. **Enums**: Django might use text fields where Drizzle uses enums. You may need to create the enums first or transform the data.




