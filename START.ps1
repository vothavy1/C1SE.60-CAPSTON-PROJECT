# CS60 System Startup Script
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  CS60 Recruitment System - Startup" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Step 1: Check MySQL
Write-Host "[1/4] Checking MySQL..." -ForegroundColor Yellow
$mysqlPort = Get-NetTCPConnection -LocalPort 3306 -ErrorAction SilentlyContinue

if ($mysqlPort) {
    Write-Host "  ✓ MySQL is running on port 3306" -ForegroundColor Green
} else {
    Write-Host "  ✗ MySQL is NOT running!" -ForegroundColor Red
    Write-Host "`n  Please start MySQL by ONE of these methods:" -ForegroundColor Yellow
    Write-Host "  Option 1: Start Docker Desktop, then run:" -ForegroundColor Cyan
    Write-Host "    cd 'd:\CAPSTON C1SE.60\CS.60\database'" -ForegroundColor White
    Write-Host "    docker-compose up -d" -ForegroundColor White
    Write-Host "`n  Option 2: Start MySQL Windows Service" -ForegroundColor Cyan
    Write-Host "    services.msc -> Find MySQL -> Start" -ForegroundColor White
    Write-Host "`n  Then run this script again!" -ForegroundColor Yellow
    Write-Host "`n========================================`n" -ForegroundColor Red
    exit 1
}

# Step 2: Kill old processes
Write-Host "`n[2/4] Cleaning up old processes..." -ForegroundColor Yellow
$oldNodes = Get-Process node -ErrorAction SilentlyContinue
if ($oldNodes) {
    $oldNodes | Stop-Process -Force
    Start-Sleep -Seconds 2
    Write-Host "  ✓ Cleaned up $($oldNodes.Count) old node process(es)" -ForegroundColor Green
} else {
    Write-Host "  ✓ No old processes to clean" -ForegroundColor Green
}

# Step 3: Start Backend
Write-Host "`n[3/4] Starting Backend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd 'd:\CAPSTON C1SE.60\CS.60\backend'; Write-Host '=== CS60 BACKEND SERVER ===' -ForegroundColor Green; npm start"
)
Start-Sleep -Seconds 6
Write-Host "  ✓ Backend starting..." -ForegroundColor Green

# Verify backend
$backendCheck = $false
for ($i = 1; $i -le 5; $i++) {
    try {
        $response = Invoke-WebRequest -Uri 'http://localhost:5000' -UseBasicParsing -TimeoutSec 2
        Write-Host "  ✓ Backend is ONLINE!" -ForegroundColor Green
        $backendCheck = $true
        break
    } catch {
        Write-Host "  Waiting for backend... ($i/5)" -ForegroundColor Gray
        Start-Sleep -Seconds 2
    }
}

if (-not $backendCheck) {
    Write-Host "  ⚠ Backend may have issues. Check the backend window for errors." -ForegroundColor Yellow
}

# Step 4: Start Frontend
Write-Host "`n[4/4] Starting Frontend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd 'd:\CAPSTON C1SE.60\CS.60\frontend'; Write-Host '=== CS60 FRONTEND SERVER ===' -ForegroundColor Green; npm start"
)
Start-Sleep -Seconds 4
Write-Host "  ✓ Frontend started!" -ForegroundColor Green

# Final summary
Write-Host "`n========================================" -ForegroundColor Green
Write-Host "  System Started Successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "`n  Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "  Backend:  http://localhost:5000" -ForegroundColor Cyan
Write-Host "`n  Test Accounts:" -ForegroundColor Yellow
Write-Host "    Email:    havy@test.com" -ForegroundColor White
Write-Host "    Password: 123456" -ForegroundColor White
Write-Host "`n========================================`n" -ForegroundColor Green

# Open browser
Write-Host "Opening browser..." -ForegroundColor Cyan
Start-Sleep -Seconds 2
Start-Process "http://localhost:3000"

Write-Host "Servers are running in separate windows." -ForegroundColor Gray
Write-Host "Close those windows to stop the servers.`n" -ForegroundColor Gray
