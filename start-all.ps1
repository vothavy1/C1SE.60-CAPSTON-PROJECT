Write-Host "=== CS60 System Startup ===" -ForegroundColor Cyan

# Kill old processes
Write-Host "Stopping old processes..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Write-Host "Done." -ForegroundColor Green

# Start Backend
Write-Host "Starting Backend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'd:\CAPSTON C1SE.60\CS.60\backend'; npm start"
Start-Sleep -Seconds 6

# Start Frontend  
Write-Host "Starting Frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'd:\CAPSTON C1SE.60\CS.60\frontend'; npm start"
Start-Sleep -Seconds 4

Write-Host "=== System Started ===" -ForegroundColor Green
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Backend:  http://localhost:5000" -ForegroundColor Cyan
Write-Host "Login: havy@test.com / 123456" -ForegroundColor White

# Open browser
Start-Sleep -Seconds 3
Start-Process "http://localhost:3000"