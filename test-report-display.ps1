# Test Report Display with Combined Chart
Write-Host "=== Testing Report Display ===" -ForegroundColor Cyan

# Login as recruiter
Write-Host "`n1. Login as recruiter..." -ForegroundColor Yellow
$loginResponse = curl.exe -s -X POST "http://localhost:5000/api/auth/login" -H "Content-Type: application/json" -d '{\"email\":\"recruiter@cs60.com\",\"password\":\"Recruiter@123\"}' | ConvertFrom-Json

if ($loginResponse.success) {
    Write-Host "Login successful" -ForegroundColor Green
    $token = $loginResponse.token
} else {
    Write-Host "Login failed" -ForegroundColor Red
    exit 1
}

# Get statistics
Write-Host "`n2. Fetching statistics..." -ForegroundColor Yellow
$statsResponse = curl.exe -s "http://localhost:5000/api/reports/statistics" -H "Authorization: Bearer $token" | ConvertFrom-Json

if ($statsResponse.success) {
    Write-Host "Statistics loaded successfully" -ForegroundColor Green
    Write-Host "Total Tests: $($statsResponse.data.totalTests)"
    Write-Host "Completed: $($statsResponse.data.completedTests)"
    Write-Host "Average Score: $($statsResponse.data.averageScore)"
} else {
    Write-Host "Failed to load statistics" -ForegroundColor Red
}

# Get violations
Write-Host "`n3. Fetching violations..." -ForegroundColor Yellow
$violationsResponse = curl.exe -s "http://localhost:5000/api/reports/violations" -H "Authorization: Bearer $token" | ConvertFrom-Json

if ($violationsResponse.success) {
    Write-Host "Violations loaded: $($violationsResponse.data.Count) records" -ForegroundColor Green
} else {
    Write-Host "Failed to load violations" -ForegroundColor Red
}

Write-Host "`n=== Test Complete ===" -ForegroundColor Cyan
Write-Host "Open http://localhost:3000/report.html to view the report" -ForegroundColor Yellow
