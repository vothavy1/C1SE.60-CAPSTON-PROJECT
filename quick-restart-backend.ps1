Write-Host "Restarting Backend Server..." -ForegroundColor Cyan

# Kill existing backend
$port = 5000
$processes = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | 
             Select-Object -ExpandProperty OwningProcess -Unique

if ($processes) {
    foreach ($p in $processes) {
        Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
        Write-Host "Stopped process $p on port $port" -ForegroundColor Yellow
    }
    Start-Sleep -Seconds 2
}

# Start backend
Write-Host "Starting backend..." -ForegroundColor Green
Set-Location backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm start"
Set-Location ..

Write-Host "Backend starting in new window. Wait 5 seconds..." -ForegroundColor Green
Start-Sleep -Seconds 5
Write-Host "Done! Backend should be running at http://localhost:5000" -ForegroundColor Green
Write-Host "Now refresh your browser and try the test again." -ForegroundColor Cyan
