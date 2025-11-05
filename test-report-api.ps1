# Test Report API Endpoints
Write-Host "=== Testing Report API Endpoints ===" -ForegroundColor Cyan

# First, let's login to get a token
Write-Host "`n1. Logging in..." -ForegroundColor Yellow
$loginResponse = curl.exe -X POST "http://localhost:5000/api/auth/login" `
    -H "Content-Type: application/json" `
    -d '{\"email\":\"admin@cs60.com\",\"password\":\"Admin@123\"}' `
    --silent

$loginData = $loginResponse | ConvertFrom-Json
$token = $loginData.data.token

if ($token) {
    Write-Host "✅ Login successful! Token: $($token.Substring(0,20))..." -ForegroundColor Green
    
    # Test Statistics API
    Write-Host "`n2. Testing GET /api/reports/statistics..." -ForegroundColor Yellow
    $statsResponse = curl.exe -X GET "http://localhost:5000/api/reports/statistics" `
        -H "Authorization: Bearer $token" `
        -H "Content-Type: application/json" `
        --silent
    
    Write-Host "Statistics Response:" -ForegroundColor Cyan
    $statsResponse | ConvertFrom-Json | ConvertTo-Json -Depth 10
    
    # Test Violations API
    Write-Host "`n3. Testing GET /api/reports/violations..." -ForegroundColor Yellow
    $violationsResponse = curl.exe -X GET "http://localhost:5000/api/reports/violations" `
        -H "Authorization: Bearer $token" `
        -H "Content-Type: application/json" `
        --silent
    
    Write-Host "Violations Response:" -ForegroundColor Cyan
    $violationsResponse | ConvertFrom-Json | ConvertTo-Json -Depth 10
    
    # Test Activity Logs API
    Write-Host "`n4. Testing GET /api/reports/activity..." -ForegroundColor Yellow
    $activityResponse = curl.exe -X GET "http://localhost:5000/api/reports/activity" `
        -H "Authorization: Bearer $token" `
        -H "Content-Type: application/json" `
        --silent
    
    Write-Host "Activity Logs Response:" -ForegroundColor Cyan
    $activityResponse | ConvertFrom-Json | ConvertTo-Json -Depth 10
    
    # Test Notifications API
    Write-Host "`n5. Testing GET /api/reports/notifications..." -ForegroundColor Yellow
    $notificationsResponse = curl.exe -X GET "http://localhost:5000/api/reports/notifications" `
        -H "Authorization: Bearer $token" `
        -H "Content-Type: application/json" `
        --silent
    
    Write-Host "Notifications Response:" -ForegroundColor Cyan
    $notificationsResponse | ConvertFrom-Json | ConvertTo-Json -Depth 10
    
    Write-Host "`n=== All API Tests Completed ===" -ForegroundColor Green
    
} else {
    Write-Host "❌ Login failed! Cannot proceed with API tests." -ForegroundColor Red
    Write-Host "Response: $loginResponse"
}
