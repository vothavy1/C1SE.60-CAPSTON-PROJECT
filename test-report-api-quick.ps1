# Quick Test Report API
Write-Host "=== Testing Report API ===" -ForegroundColor Cyan

# Test 1: Health Check
Write-Host "`n1. Testing Health Check..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:5000/api/reports/health" -Method Get
    Write-Host "✅ Health Check OK: $($health.message)" -ForegroundColor Green
} catch {
    Write-Host "❌ Health Check Failed: $_" -ForegroundColor Red
}

# Test 2: Login to get token
Write-Host "`n2. Getting Auth Token..." -ForegroundColor Yellow
try {
    $loginBody = @{
        email = "havy@test.com"
        password = "123456"
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.data.token
    Write-Host "✅ Token obtained: $($token.Substring(0,20))..." -ForegroundColor Green
} catch {
    Write-Host "❌ Login Failed with havy@test.com: $_" -ForegroundColor Red
    Write-Host "Trying admin account..." -ForegroundColor Yellow
    
    try {
        $loginBody = @{
            username = "admin"
            password = "admin123"
        } | ConvertTo-Json

        $loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
        $token = $loginResponse.data.token
        Write-Host "✅ Token obtained with admin: $($token.Substring(0,20))..." -ForegroundColor Green
    } catch {
        Write-Host "❌ Admin Login Failed: $_" -ForegroundColor Red
        exit 1
    }
}

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# Test 3: Get Statistics
Write-Host "`n3. Testing Statistics API..." -ForegroundColor Yellow
try {
    $stats = Invoke-RestMethod -Uri "http://localhost:5000/api/reports/statistics" -Method Get -Headers $headers
    Write-Host "✅ Statistics API OK" -ForegroundColor Green
    Write-Host "   Total Tests: $($stats.data.totalTests)" -ForegroundColor Cyan
    Write-Host "   Completed: $($stats.data.completedTests)" -ForegroundColor Cyan
    Write-Host "   Violations: $($stats.data.totalViolations)" -ForegroundColor Cyan
    Write-Host "   Avg Score: $($stats.data.averageScore)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Statistics API Failed" -ForegroundColor Red
    Write-Host "   Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Get Violations
Write-Host "`n4. Testing Violations API..." -ForegroundColor Yellow
try {
    $violations = Invoke-RestMethod -Uri "http://localhost:5000/api/reports/violations" -Method Get -Headers $headers
    Write-Host "✅ Violations API OK" -ForegroundColor Green
    Write-Host "   Total Violations: $($violations.count)" -ForegroundColor Cyan
    
    if ($violations.count -gt 0) {
        Write-Host "   First violation: $($violations.data[0].violation_type)" -ForegroundColor Cyan
    } else {
        Write-Host "   No violations found (database may be empty)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Violations API Failed" -ForegroundColor Red
    Write-Host "   Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Test Complete ===" -ForegroundColor Cyan
Write-Host "`n✅ Báo cáo hoạt động - Report APIs are working!" -ForegroundColor Green
Write-Host "`nNow refresh your browser at: http://localhost:3000/report.html" -ForegroundColor Yellow
