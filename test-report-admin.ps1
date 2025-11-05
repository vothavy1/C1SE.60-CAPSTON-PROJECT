# Test Report API with ADMIN user
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  TEST REPORT API - ADMIN USER" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$baseUrl = "http://localhost:5000/api"

# Step 1: Login with RECRUITER
Write-Host "1️⃣ Logging in with RECRUITER user..." -ForegroundColor Yellow
$loginData = @{
    username = "recruiter_test"
    password = "123456"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" `
        -Method Post `
        -Body $loginData `
        -ContentType "application/json"
    
    Write-Host "✅ Login successful!" -ForegroundColor Green
    Write-Host "   User: $($loginResponse.data.user.username)" -ForegroundColor White
    Write-Host "   Role: $($loginResponse.data.user.role)" -ForegroundColor White
    Write-Host "   Token: $($loginResponse.data.token.Substring(0,20))..." -ForegroundColor Gray
    
    $token = $loginResponse.data.token
    
} catch {
    Write-Host "❌ Login failed: $_" -ForegroundColor Red
    exit 1
}

# Step 2: Test Statistics API
Write-Host "`n2️⃣ Testing Statistics API..." -ForegroundColor Yellow
try {
    $statsResponse = Invoke-RestMethod -Uri "$baseUrl/reports/statistics" `
        -Method Get `
        -Headers @{"Authorization" = "Bearer $token"}
    
    Write-Host "✅ Statistics API successful!" -ForegroundColor Green
    Write-Host "   Total Tests: $($statsResponse.data.totalTests)" -ForegroundColor White
    Write-Host "   Completed: $($statsResponse.data.completedTests)" -ForegroundColor White
    Write-Host "   Violations: $($statsResponse.data.totalViolations)" -ForegroundColor White
    Write-Host "   Avg Score: $($statsResponse.data.averageScore)" -ForegroundColor White
    
} catch {
    Write-Host "❌ Statistics API failed: $_" -ForegroundColor Red
    Write-Host "   Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
}

# Step 3: Test Violations API
Write-Host "`n3️⃣ Testing Violations API..." -ForegroundColor Yellow
try {
    $violationsResponse = Invoke-RestMethod -Uri "$baseUrl/reports/violations" `
        -Method Get `
        -Headers @{"Authorization" = "Bearer $token"}
    
    Write-Host "✅ Violations API successful!" -ForegroundColor Green
    Write-Host "   Total Violations: $($violationsResponse.count)" -ForegroundColor White
    
    if ($violationsResponse.data.Count -gt 0) {
        Write-Host "`n   Sample Violations:" -ForegroundColor Cyan
        $violationsResponse.data | Select-Object -First 3 | ForEach-Object {
            Write-Host "   - $($_.candidate_name): $($_.violation_type) at $($_.event_time)" -ForegroundColor Gray
        }
    } else {
        Write-Host "   No violations found (clean data)" -ForegroundColor Gray
    }
    
} catch {
    Write-Host "❌ Violations API failed: $_" -ForegroundColor Red
    Write-Host "   Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
}

# Step 4: Test with CANDIDATE user (should fail)
Write-Host "`n4️⃣ Testing with CANDIDATE user (should fail)..." -ForegroundColor Yellow
$candidateLogin = @{
    username = "havy"
    password = "123456"
} | ConvertTo-Json

try {
    $candidateLoginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" `
        -Method Post `
        -Body $candidateLogin `
        -ContentType "application/json"
    
    $candidateToken = $candidateLoginResponse.data.token
    Write-Host "   Logged in as: $($candidateLoginResponse.data.user.username) ($($candidateLoginResponse.data.user.role))" -ForegroundColor Gray
    
    # Try to access statistics (should fail with 403)
    try {
        $result = Invoke-RestMethod -Uri "$baseUrl/reports/statistics" `
            -Method Get `
            -Headers @{"Authorization" = "Bearer $candidateToken"}
        
        Write-Host "❌ SECURITY ISSUE: Candidate can access reports!" -ForegroundColor Red
        
    } catch {
        if ($_.Exception.Response.StatusCode.value__ -eq 403) {
            Write-Host "✅ Correctly blocked: 403 Forbidden" -ForegroundColor Green
            Write-Host "   CANDIDATE cannot access reports (as expected)" -ForegroundColor White
        } else {
            Write-Host "⚠️ Unexpected error: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Yellow
        }
    }
    
} catch {
    Write-Host "⚠️ Could not test CANDIDATE user: $_" -ForegroundColor Yellow
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  ✅ Báo cáo hoạt động!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan
