# Test Result Visibility System
Write-Host "`n=== TEST RESULT VISIBILITY SYSTEM ===" -ForegroundColor Cyan

# Login as candidate havy
Write-Host "`n1. Logging in as candidate havy..." -ForegroundColor Yellow
try {
    $loginResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body '{"username":"havy","password":"123456"}' `
        -UseBasicParsing

    $loginData = $loginResponse.Content | ConvertFrom-Json
    $token = $loginData.data.token
    
    if ($token) {
        Write-Host "✅ Login successful! Token: $($token.Substring(0,20))..." -ForegroundColor Green
    } else {
        Write-Host "❌ Login failed: No token received" -ForegroundColor Red
        Write-Host "Response: $($loginResponse.Content)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Get my tests
Write-Host "`n2. Getting my tests..." -ForegroundColor Yellow
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$testsResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/candidate-tests/my-tests" `
    -Method GET `
    -Headers $headers `
    -UseBasicParsing

$testsData = $testsResponse.Content | ConvertFrom-Json
Write-Host "✅ Found $($testsData.data.Count) tests" -ForegroundColor Green

# Show first test details
if ($testsData.data.Count -gt 0) {
    $firstTest = $testsData.data[0]
    Write-Host "`nTest Details:" -ForegroundColor Cyan
    Write-Host "  ID: $($firstTest.candidate_test_id)"
    Write-Host "  Status: $($firstTest.status)"
    Write-Host "  Is Result Visible: $($firstTest.is_result_visible)"
    
    if ($firstTest.is_result_visible) {
        Write-Host "  Score: $($firstTest.score)" -ForegroundColor Green
        if ($firstTest.CandidateTestResult) {
            $resultText = if ($firstTest.CandidateTestResult.passed) { "PASSED" } else { "FAILED" }
            Write-Host "  Result: $resultText" -ForegroundColor Green
        }
    } else {
        Write-Host "  Score: HIDDEN (not visible yet)" -ForegroundColor Yellow
        Write-Host "  Result: HIDDEN (not visible yet)" -ForegroundColor Yellow
    }
}

# Check database to verify is_result_visible column
Write-Host "`n3. Checking database..." -ForegroundColor Yellow
docker exec cs60_mysql mysql -uroot -prootpassword cs60_recruitment -e "SELECT candidate_test_id, status, score, passing_status, is_result_visible FROM candidate_tests ORDER BY candidate_test_id DESC LIMIT 5;"

Write-Host "`n=== TEST COMPLETE ===" -ForegroundColor Cyan
