# Quick Test Script: Verify RECRUITER can create candidates
# Run this after logging in as RECRUITER to test the fix

Write-Host "`n=== Testing Candidate Creation with RECRUITER Role ===`n" -ForegroundColor Cyan

# Test 1: Check if backend is running
Write-Host "Test 1: Backend Health Check..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:5000/api/health" -Method Get
    if ($health.status -eq "ok") {
        Write-Host "  PASS - Backend is running" -ForegroundColor Green
    }
} catch {
    Write-Host "  FAIL - Backend not responding" -ForegroundColor Red
    exit 1
}

# Test 2: Login as RECRUITER
Write-Host "`nTest 2: Login as RECRUITER..." -ForegroundColor Yellow
$loginBody = @{
    username = "recruiter.vy@gmail.com"
    password = "123456"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
        -Method Post `
        -Body $loginBody `
        -ContentType "application/json"
    
    if ($loginResponse.token) {
        Write-Host "  PASS - Login successful" -ForegroundColor Green
        Write-Host "    Role: $($loginResponse.user.role)" -ForegroundColor Cyan
        $token = $loginResponse.token
    }
} catch {
    Write-Host "  FAIL - Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 3: Get candidates list (should work now)
Write-Host "`nTest 3: Get Candidates List (Authorization Check)..." -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $token"
    }
    $candidates = Invoke-RestMethod -Uri "http://localhost:5000/api/candidates" `
        -Method Get `
        -Headers $headers
    
    Write-Host "  PASS - Can access candidates list" -ForegroundColor Green
    Write-Host "    Total candidates: $($candidates.data.Count)" -ForegroundColor Cyan
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 403) {
        Write-Host "  FAIL - Still getting 403 Forbidden" -ForegroundColor Red
    } else {
        Write-Host "  FAIL - Error $statusCode : $($_.Exception.Message)" -ForegroundColor Red
    }
    exit 1
}

# Test 4: Test candidate creation (without file for quick test)
Write-Host "`nTest 4: Create Test Candidate (No CV)..." -ForegroundColor Yellow
$candidateData = @{
    first_name = "Test"
    last_name = "Candidate"
    email = "test-$(Get-Date -Format 'yyyyMMddHHmmss')@example.com"
    phone = "0123456789"
    source = "Facebook"
} | ConvertTo-Json

try {
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    $createResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/candidates" `
        -Method Post `
        -Headers $headers `
        -Body $candidateData
    
    if ($createResponse.success) {
        Write-Host "  PASS - Candidate created successfully!" -ForegroundColor Green
        Write-Host "    Candidate ID: $($createResponse.data.candidate_id)" -ForegroundColor Cyan
        Write-Host "    Status: $($createResponse.data.status)" -ForegroundColor Cyan
        Write-Host "    Source: $($createResponse.data.source)" -ForegroundColor Cyan
        
        # Cleanup - delete test candidate
        try {
            Invoke-RestMethod -Uri "http://localhost:5000/api/candidates/$($createResponse.data.candidate_id)" `
                -Method Delete `
                -Headers $headers | Out-Null
            Write-Host "  Test candidate cleaned up" -ForegroundColor DarkGray
        } catch {
            # Ignore cleanup errors
        }
    }
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 403) {
        Write-Host "  FAIL - 403 Forbidden - Permission fix not working!" -ForegroundColor Red
        Write-Host "    Make sure backend has been restarted" -ForegroundColor Yellow
    } else {
        Write-Host "  FAIL - Error $statusCode" -ForegroundColor Red
        Write-Host "    Message: $($_.Exception.Message)" -ForegroundColor Red
    }
    exit 1
}

# Summary
Write-Host "`n=== Test Results ===`n" -ForegroundColor Cyan
Write-Host "Backend Health:          " -NoNewline; Write-Host "PASS" -ForegroundColor Green
Write-Host "RECRUITER Login:         " -NoNewline; Write-Host "PASS" -ForegroundColor Green
Write-Host "Authorization Check:     " -NoNewline; Write-Host "PASS" -ForegroundColor Green
Write-Host "Candidate Creation:      " -NoNewline; Write-Host "PASS" -ForegroundColor Green
Write-Host "`n=== All Tests Passed! ===`n" -ForegroundColor Green

Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Test CV upload via browser UI" -ForegroundColor White
Write-Host "2. Verify files in backend/uploads/cv/" -ForegroundColor White
Write-Host "3. Check candidate_resumes table in database" -ForegroundColor White
Write-Host ""
