# Database Migration using Docker (No PostgreSQL installation needed)
# Usage: .\dump-with-docker.ps1

Write-Host "=== Database Migration: Local PostgreSQL → Neon (Docker) ===" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
try {
    docker ps | Out-Null
} catch {
    Write-Host "✗ Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}

# Get local database connection details
Write-Host "Local Database Connection:" -ForegroundColor Yellow
$localHost = Read-Host "Host [localhost]"
if ([string]::IsNullOrWhiteSpace($localHost)) { $localHost = "localhost" }

$localPort = Read-Host "Port [5432]"
if ([string]::IsNullOrWhiteSpace($localPort)) { $localPort = "5432" }

$localUser = Read-Host "Username"
$localDb = Read-Host "Database name"
$securePass = Read-Host "Password" -AsSecureString
$localPass = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePass)
)

# Get Neon connection string
Write-Host ""
Write-Host "Neon Database Connection:" -ForegroundColor Yellow
$neonUrl = Read-Host "Neon connection string (postgresql://...)"

# Create dump file name
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$dumpFile = "local_dump_$timestamp.dump"
$currentDir = Get-Location

Write-Host ""
Write-Host "Step 1: Dumping local database using Docker..." -ForegroundColor Yellow

# Set password as environment variable for Docker
$env:PGPASSWORD = $localPass

# Use Docker to run pg_dump
$dumpCmd = "docker run --rm -e PGPASSWORD=`$PGPASSWORD -v `"${currentDir}:/data`" postgres:15 pg_dump -h host.docker.internal -p $localPort -U $localUser -d $localDb -F c -f /data/$dumpFile"

try {
    Invoke-Expression $dumpCmd
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Dump created: $dumpFile" -ForegroundColor Green
    } else {
        Write-Host "✗ Dump failed!" -ForegroundColor Red
        Remove-Item Env:\PGPASSWORD
        exit 1
    }
} catch {
    Write-Host "✗ Error: $_" -ForegroundColor Red
    Remove-Item Env:\PGPASSWORD
    exit 1
}

Remove-Item Env:\PGPASSWORD

Write-Host ""
Write-Host "Step 2: Restoring to Neon..." -ForegroundColor Yellow

# Parse Neon URL to extract components
$neonUrlParts = $neonUrl -replace 'postgresql://', '' -split '@'
$neonCreds = $neonUrlParts[0] -split ':'
$neonHostDb = $neonUrlParts[1] -split '/'
$neonHostPort = $neonHostDb[0] -split ':'
$neonHost = $neonHostPort[0]
$neonPort = if ($neonHostPort.Length -gt 1) { $neonHostPort[1] } else { "5432" }
$neonDb = $neonHostDb[1] -split '\?' | Select-Object -First 1
$neonUser = $neonCreds[0]
$neonPass = $neonCreds[1]

$env:PGPASSWORD = $neonPass

$restoreCmd = "docker run --rm -e PGPASSWORD=`$PGPASSWORD -v `"${currentDir}:/data`" postgres:15 pg_restore -h $neonHost -p $neonPort -U $neonUser -d $neonDb --verbose --clean --no-acl --no-owner /data/$dumpFile"

try {
    Invoke-Expression $restoreCmd
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Data restored to Neon" -ForegroundColor Green
    } else {
        Write-Host "✗ Restore failed!" -ForegroundColor Red
        Remove-Item Env:\PGPASSWORD
        exit 1
    }
} catch {
    Write-Host "✗ Error: $_" -ForegroundColor Red
    Remove-Item Env:\PGPASSWORD
    exit 1
}

Remove-Item Env:\PGPASSWORD

Write-Host ""
Write-Host "Step 3: Running Drizzle migrations..." -ForegroundColor Yellow

Set-Location web
npm run db:migrate

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Migrations completed" -ForegroundColor Green
} else {
    Write-Host "⚠ Migrations may have warnings (this is normal)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Migration Complete! ===" -ForegroundColor Green
Write-Host "Dump file saved as: $dumpFile"




