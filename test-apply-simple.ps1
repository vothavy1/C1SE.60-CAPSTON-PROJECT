# Simple Test for Apply System
Write-Host "Testing Apply System APIs" -ForegroundColor Cyan
Write-Host ""

# Test backend health
Write-Host "1. Testing backend..." -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "http://localhost:5000/api/health" | Out-Null
    Write-Host "Backend is running OK" -ForegroundColor Green
} catch {
    Write-Host "Backend is NOT running!" -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "2. Getting recruiter from database..." -ForegroundColor Yellow
docker exec cs60_mysql mysql -uroot -prootpassword cs60_recruitment -e "SELECT email FROM users WHERE role_id IN (SELECT role_id FROM roles WHERE role_name = 'RECRUITER') LIMIT 1;"

Write-Host ""
Write-Host "=== API Endpoints Created ===" -ForegroundColor Cyan
Write-Host "POST /api/apply - Submit CV (Public, no auth)" -ForegroundColor White
Write-Host "GET  /api/candidates - List candidates (Auth required)" -ForegroundColor White
Write-Host "PUT  /api/candidates/:id/status - Update status (Auth required)" -ForegroundColor White
Write-Host "GET  /api/candidates/:id/cv - Download CV (Auth required)" -ForegroundColor White

Write-Host ""
Write-Host "=== Manual Testing ===" -ForegroundColor Cyan
Write-Host "1. Open http://localhost:3000/apply.html" -ForegroundColor Yellow
Write-Host "   - Fill form and upload CV file" -ForegroundColor Gray
Write-Host "   - Click Submit" -ForegroundColor Gray

Write-Host ""
Write-Host "2. Login as Recruiter at http://localhost:3000/index.html" -ForegroundColor Yellow
Write-Host "   - Use recruiter account from database" -ForegroundColor Gray

Write-Host ""
Write-Host "3. Open http://localhost:3000/candidate-management.html" -ForegroundColor Yellow
Write-Host "   - View all candidates" -ForegroundColor Gray
Write-Host "   - Click CV button to download" -ForegroundColor Gray
Write-Host "   - Click Pass/Fail to update status" -ForegroundColor Gray

Write-Host ""
Write-Host "System is ready!" -ForegroundColor Green
