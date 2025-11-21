# Simple Violations API Test
Write-Host "=== Testing Violations API ===" -ForegroundColor Cyan

# Check if violations.json exists
Write-Host "`n1. Checking violations.json file..." -ForegroundColor Yellow
$violationsFile = "backend\reports\violations.json"
if (Test-Path $violationsFile) {
    $data = Get-Content $violationsFile -Raw | ConvertFrom-Json
    Write-Host "   File exists with $($data.Count) violations" -ForegroundColor Green
    Write-Host "   First: $($data[0].candidate_name) - $($data[0].violation_type)" -ForegroundColor Cyan
} else {
    Write-Host "   ERROR: File not found!" -ForegroundColor Red
    exit 1
}

# Check if backend is running
Write-Host "`n2. Checking backend server..." -ForegroundColor Yellow
$port = netstat -ano | findstr ":5000"
if ($port) {
    Write-Host "   Backend is running on port 5000" -ForegroundColor Green
} else {
    Write-Host "   ERROR: Backend not running!" -ForegroundColor Red
    exit 1
}

# Try to access API without auth (should fail with 401)
Write-Host "`n3. Testing API endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/reports/violations" -Method Get -UseBasicParsing
    Write-Host "   ERROR: API should require authentication!" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "   API requires authentication (correct)" -ForegroundColor Green
    } else {
        Write-Host "   Unexpected error: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

Write-Host "`n=== Next Steps ===" -ForegroundColor Cyan
Write-Host "1. Open http://localhost:3000/login.html" -ForegroundColor White
Write-Host "2. Login with your recruiter account" -ForegroundColor White
Write-Host "3. Open browser DevTools (F12)" -ForegroundColor White
Write-Host "4. Go to Console tab" -ForegroundColor White
Write-Host "5. Run: localStorage.getItem('token')" -ForegroundColor White
Write-Host "6. Copy the token and test manually" -ForegroundColor White
Write-Host "`nOr check browser console for error messages" -ForegroundColor Yellow
