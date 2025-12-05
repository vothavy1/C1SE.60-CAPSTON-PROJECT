Write-Host "=== CS60 System Health Check ===" -ForegroundColor Cyan
Write-Host "Checking system status..." -ForegroundColor Yellow

# 1. Check Node.js
Write-Host "`n1. Checking Node.js..." -ForegroundColor Green
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js" -ForegroundColor Red
}

# 2. Check npm
try {
    $npmVersion = npm --version
    Write-Host "✅ npm: v$npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm not found" -ForegroundColor Red
}

# 3. Check Docker
Write-Host "`n2. Checking Docker..." -ForegroundColor Green
try {
    $dockerVersion = docker --version
    Write-Host "✅ Docker: $dockerVersion" -ForegroundColor Green
    
    # Check MySQL container
    $mysqlStatus = docker ps --filter "name=cs60_mysql" --format "table {{.Names}}\t{{.Status}}"
    if ($mysqlStatus -like "*cs60_mysql*") {
        Write-Host "✅ MySQL container is running" -ForegroundColor Green
    } else {
        Write-Host "⚠️  MySQL container not running" -ForegroundColor Yellow
        Write-Host "   Run: cd database; docker-compose up -d" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Docker not found or not running" -ForegroundColor Red
}

# 4. Check ports
Write-Host "`n3. Checking ports..." -ForegroundColor Green
$ports = @(3000, 5000, 3306, 8080)
$portNames = @("Frontend", "Backend", "MySQL", "phpMyAdmin")

for ($i = 0; $i -lt $ports.Length; $i++) {
    $port = $ports[$i]
    $name = $portNames[$i]
    
    $connection = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($connection) {
        Write-Host "⚠️  Port $port ($name) is in use" -ForegroundColor Yellow
    } else {
        Write-Host "✅ Port $port ($name) available" -ForegroundColor Green
    }
}

# 5. Check files
Write-Host "`n4. Checking project files..." -ForegroundColor Green
$requiredFiles = @(
    "backend\package.json",
    "backend\.env",
    "backend\src\server.js",
    "frontend\package.json", 
    "frontend\server.js",
    "docker-compose.yml",
    "start-all.ps1"
)

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file" -ForegroundColor Green
    } else {
        Write-Host "❌ $file - MISSING" -ForegroundColor Red
    }
}

# 6. Run detailed Node.js check
Write-Host "`n5. Running detailed system check..." -ForegroundColor Green
if (Test-Path "check-system.js") {
    try {
        node check-system.js
    } catch {
        Write-Host "❌ Error running detailed check" -ForegroundColor Red
    }
} else {
    Write-Host "⚠️  check-system.js not found, skipping detailed check" -ForegroundColor Yellow
}

Write-Host "`n=== Quick Commands ===" -ForegroundColor Cyan
Write-Host "Start system:      .\start-all.ps1" -ForegroundColor White
Write-Host "Start database:    cd database; docker-compose up -d" -ForegroundColor White
Write-Host "Stop all:          docker-compose down" -ForegroundColor White
Write-Host "View logs:         docker logs cs60_mysql" -ForegroundColor White
Write-Host "Reset database:    docker-compose down -v; docker-compose up -d" -ForegroundColor White

Write-Host "`n=== System URLs ===" -ForegroundColor Cyan
Write-Host "Frontend:          http://localhost:3000" -ForegroundColor White
Write-Host "Backend:           http://localhost:5000" -ForegroundColor White
Write-Host "phpMyAdmin:        http://localhost:8080" -ForegroundColor White

Write-Host "`nPress any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")