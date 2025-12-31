#!/bin/bash

# Database Migration Script: Local PostgreSQL → Neon
# Usage: ./migrate-db.sh

set -e

echo "=== Database Migration: Local PostgreSQL → Neon ==="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get local database connection details
read -p "Local DB Host [localhost]: " LOCAL_HOST
LOCAL_HOST=${LOCAL_HOST:-localhost}

read -p "Local DB Port [5432]: " LOCAL_PORT
LOCAL_PORT=${LOCAL_PORT:-5432}

read -p "Local DB Username: " LOCAL_USER
read -p "Local DB Name: " LOCAL_DB
read -s -p "Local DB Password: " LOCAL_PASS
echo ""

# Get Neon database connection details
read -p "Neon Database URL (full connection string): " NEON_URL

# Dump file name
DUMP_FILE="local_dump_$(date +%Y%m%d_%H%M%S).dump"

echo ""
echo -e "${YELLOW}Step 1: Dumping local database...${NC}"
PGPASSWORD=$LOCAL_PASS pg_dump -h $LOCAL_HOST -p $LOCAL_PORT -U $LOCAL_USER -d $LOCAL_DB -F c -f $DUMP_FILE

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Dump created: $DUMP_FILE${NC}"
else
    echo -e "${RED}✗ Dump failed!${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Step 2: Restoring to Neon...${NC}"
pg_restore -d "$NEON_URL" --verbose --clean --no-acl --no-owner $DUMP_FILE

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Data restored to Neon${NC}"
else
    echo -e "${RED}✗ Restore failed!${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Step 3: Running Drizzle migrations...${NC}"
cd web
npm run db:migrate

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Migrations completed${NC}"
else
    echo -e "${RED}✗ Migrations failed!${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}=== Migration Complete! ===${NC}"
echo "Dump file saved as: $DUMP_FILE"




