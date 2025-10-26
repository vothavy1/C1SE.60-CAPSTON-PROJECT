# CS60 System Health Check Script
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  CS60 System Health Check" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$allGood = $true

# Check Node.js
Write-Host "Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js not installed!" -ForegroundColor Red
    $allGood = $false
}

# Check npm
Write-Host "Checking npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "✓ npm: v$npmVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ npm not installed!" -ForegroundColor Red
    $allGood = $false
}

# Check Docker
Write-Host "Checking Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "✓ Docker: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker not installed!" -ForegroundColor Red
    $allGood = $false
}

# Check MySQL Container
Write-Host "Checking MySQL container..." -ForegroundColor Yellow
$mysqlContainer = docker ps --filter "name=cs60_mysql" --format "{{.Status}}"
if ($mysqlContainer -like "*Up*") {
    Write-Host "✓ MySQL container is running" -ForegroundColor Green
} else {
    Write-Host "✗ MySQL container is not running!" -ForegroundColor Red
    Write-Host "  Run: cd database; docker-compose up -d" -ForegroundColor Yellow
    $allGood = $false
}

# Check Backend port
Write-Host "Checking Backend (port 5000)..." -ForegroundColor Yellow
$backendPort = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
if ($backendPort) {
    Write-Host "✓ Backend is running on port 5000" -ForegroundColor Green
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5000" -UseBasicParsing -TimeoutSec 2
        Write-Host "  Status: $($response.StatusCode)" -ForegroundColor Cyan
    } catch {
        Write-Host "  Warning: Port occupied but not responding" -ForegroundColor Yellow
    }
} else {
    Write-Host "✗ Backend is not running" -ForegroundColor Red
    Write-Host "  Run: cd backend; npm start" -ForegroundColor Yellow
    $allGood = $false
}

# Check Frontend port
Write-Host "Checking Frontend (port 3000)..." -ForegroundColor Yellow
$frontendPort = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($frontendPort) {
    Write-Host "✓ Frontend is running on port 3000" -ForegroundColor Green
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 2
        Write-Host "  Status: $($response.StatusCode)" -ForegroundColor Cyan
    } catch {
        Write-Host "  Warning: Port occupied but not responding" -ForegroundColor Yellow
    }
} else {
    Write-Host "✗ Frontend is not running" -ForegroundColor Red
    Write-Host "  Run: cd frontend; npm start" -ForegroundColor Yellow
    $allGood = $false
}

# Check backend dependencies
Write-Host "Checking Backend dependencies..." -ForegroundColor Yellow
$backendNodeModules = Test-Path "d:\CAPSTON C1SE.60\CS.60\backend\node_modules"
if ($backendNodeModules) {
    Write-Host "✓ Backend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✗ Backend dependencies not installed!" -ForegroundColor Red
    Write-Host "  Run: cd backend; npm install" -ForegroundColor Yellow
    $allGood = $false
}

# Check .env file
Write-Host "Checking Backend .env file..." -ForegroundColor Yellow
$envFile = Test-Path "d:\CAPSTON C1SE.60\CS.60\backend\.env"
if ($envFile) {
    Write-Host "✓ .env file exists" -ForegroundColor Green
} else {
    Write-Host "✗ .env file not found!" -ForegroundColor Red
    $allGood = $false
}

Write-Host "`n========================================" -ForegroundColor Cyan
if ($allGood) {
    Write-Host "  ✅ All systems operational!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "`nYou can access:" -ForegroundColor Yellow
    Write-Host "  Frontend: http://localhost:3000" -ForegroundColor Cyan
    Write-Host "  Backend:  http://localhost:5000" -ForegroundColor Cyan
    Write-Host "  phpMyAdmin: http://localhost:8080`n" -ForegroundColor Cyan
} else {
    Write-Host "  ⚠️  Some issues detected!" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "`nTo start all services:" -ForegroundColor Yellow
    Write-Host "  .\start-all.ps1`n" -ForegroundColor Cyan
}
