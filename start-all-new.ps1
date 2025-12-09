Write-Host "=== CS60 System Startup ===" -ForegroundColor Cyan

# Kill old processes
Write-Host "Stopping old processes..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Write-Host "Done." -ForegroundColor Green

# Start Backend
Write-Host "Starting Backend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'd:\CAPSTON C1SE.60\CS.60\backend'; npm start"

# Wait for backend to be ready
Write-Host "Waiting for backend to start..." -ForegroundColor Yellow
$backendReady = $false
$maxAttempts = 30
$attempt = 0

while (-not $backendReady -and $attempt -lt $maxAttempts) {
    Start-Sleep -Seconds 1
    $attempt++
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5000/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $backendReady = $true
            Write-Host "Backend is ready!" -ForegroundColor Green
        }
    } catch {
        Write-Host "." -NoNewline -ForegroundColor Gray
    }
}

if (-not $backendReady) {
    Write-Host ""
    Write-Host "Backend failed to start after $maxAttempts seconds" -ForegroundColor Red
    exit 1
}

# Start Frontend  
Write-Host "Starting Frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'd:\CAPSTON C1SE.60\CS.60\frontend'; npm start"
Start-Sleep -Seconds 4

Write-Host ""
Write-Host "=== System Started ===" -ForegroundColor Green
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Backend:  http://localhost:5000" -ForegroundColor Cyan
Write-Host "Health:   http://localhost:5000/health" -ForegroundColor Cyan
Write-Host "Login:    havy@test.com / 123456" -ForegroundColor White

# Open browser
Start-Sleep -Seconds 2
Start-Process "http://localhost:3000"
