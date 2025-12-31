# Script to find PostgreSQL connection details
Write-Host "=== Finding PostgreSQL Connection Details ===" -ForegroundColor Cyan
Write-Host ""

# Check for PostgreSQL services
Write-Host "Checking PostgreSQL services..." -ForegroundColor Yellow
$services = Get-Service -Name "*postgres*" -ErrorAction SilentlyContinue
if ($services) {
    foreach ($service in $services) {
        Write-Host "  Found: $($service.Name) - Status: $($service.Status)" -ForegroundColor Green
    }
} else {
    Write-Host "  No PostgreSQL services found" -ForegroundColor Red
}

# Check for listening ports
Write-Host ""
Write-Host "Checking for PostgreSQL ports..." -ForegroundColor Yellow
$ports = netstat -an | Select-String "LISTENING" | Select-String "5432"
if ($ports) {
    Write-Host "  PostgreSQL may be listening on port 5432" -ForegroundColor Green
    $ports | ForEach-Object { Write-Host "    $_" }
} else {
    Write-Host "  No process listening on port 5432" -ForegroundColor Red
}

# Check for Docker containers
Write-Host ""
Write-Host "Checking for Docker PostgreSQL containers..." -ForegroundColor Yellow
try {
    $dockerContainers = docker ps -a --filter "ancestor=postgres" --format "{{.Names}} - {{.Status}}" 2>$null
    if ($dockerContainers) {
        Write-Host "  Found Docker PostgreSQL containers:" -ForegroundColor Green
        $dockerContainers | ForEach-Object { Write-Host "    $_" }
    } else {
        Write-Host "  No Docker PostgreSQL containers found" -ForegroundColor Gray
    }
} catch {
    Write-Host "  Docker not available or not running" -ForegroundColor Gray
}

# Check common PostgreSQL installation paths
Write-Host ""
Write-Host "Checking common PostgreSQL installation paths..." -ForegroundColor Yellow
$commonPaths = @(
    "C:\Program Files\PostgreSQL",
    "C:\Program Files (x86)\PostgreSQL",
    "$env:LOCALAPPDATA\Programs\PostgreSQL"
)

foreach ($path in $commonPaths) {
    if (Test-Path $path) {
        Write-Host "  Found: $path" -ForegroundColor Green
        $versions = Get-ChildItem $path -Directory -ErrorAction SilentlyContinue
        foreach ($version in $versions) {
            Write-Host "    Version: $($version.Name)" -ForegroundColor Cyan
        }
    }
}

# Check environment variables
Write-Host ""
Write-Host "Checking environment variables..." -ForegroundColor Yellow
$envVars = @("PGHOST", "PGPORT", "PGUSER", "PGDATABASE", "DATABASE_URL")
foreach ($var in $envVars) {
    $value = [Environment]::GetEnvironmentVariable($var)
    if ($value) {
        Write-Host "  $var = $value" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "=== Tips ===" -ForegroundColor Cyan
Write-Host "1. If PostgreSQL is installed but not running, start it from Services (services.msc)" -ForegroundColor Yellow
Write-Host "2. If using Docker, use: docker ps to see running containers" -ForegroundColor Yellow
Write-Host "3. Check your Django .env file for DATABASE_URL or DB connection details" -ForegroundColor Yellow
Write-Host "4. Default PostgreSQL port is 5432, but it might be different" -ForegroundColor Yellow




