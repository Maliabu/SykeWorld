# Database Migration Script: Local PostgreSQL → Neon (PowerShell)
# Usage: .\migrate-db.ps1

Write-Host "=== Database Migration: Local PostgreSQL → Neon ===" -ForegroundColor Cyan
Write-Host ""

# Get local database connection details
$localHost = Read-Host "Local DB Host [localhost]"
if ([string]::IsNullOrWhiteSpace($localHost)) { $localHost = "localhost" }

$localPort = Read-Host "Local DB Port [5432]"
if ([string]::IsNullOrWhiteSpace($localPort)) { $localPort = "5432" }

$localUser = Read-Host "Local DB Username"
$localDb = Read-Host "Local DB Name"
$securePass = Read-Host "Local DB Password" -AsSecureString
$localPass = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePass)
)

# Get Neon database connection details
$neonUrl = Read-Host "Neon Database URL (full connection string)"

# Dump file name
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$dumpFile = "local_dump_$timestamp.dump"

Write-Host ""
Write-Host "Step 1: Dumping local database..." -ForegroundColor Yellow

$env:PGPASSWORD = $localPass
$dumpCmd = "pg_dump -h $localHost -p $localPort -U $localUser -d $localDb -F c -f $dumpFile"

try {
    Invoke-Expression $dumpCmd
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Dump created: $dumpFile" -ForegroundColor Green
    } else {
        Write-Host "✗ Dump failed!" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "✗ Error: $_" -ForegroundColor Red
    exit 1
} finally {
    Remove-Item Env:\PGPASSWORD
}

Write-Host ""
Write-Host "Step 2: Restoring to Neon..." -ForegroundColor Yellow

$restoreCmd = "pg_restore -d `"$neonUrl`" --verbose --clean --no-acl --no-owner $dumpFile"

try {
    Invoke-Expression $restoreCmd
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Data restored to Neon" -ForegroundColor Green
    } else {
        Write-Host "✗ Restore failed!" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "✗ Error: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 3: Running Drizzle migrations..." -ForegroundColor Yellow

Set-Location web
npm run db:migrate

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Migrations completed" -ForegroundColor Green
} else {
    Write-Host "✗ Migrations failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== Migration Complete! ===" -ForegroundColor Green
Write-Host "Dump file saved as: $dumpFile"




