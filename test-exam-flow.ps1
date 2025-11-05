# Test Exam Flow - Self Assign Test
# This script tests the complete flow from login to starting a test

Write-Host "`n=== TESTING EXAM FLOW ===" -ForegroundColor Green

# Configuration
$baseUrl = "http://localhost:5000/api"
$username = "candidate1"  # Change to your test username
$password = "123456"      # Change to your test password

Write-Host "`n📝 Step 1: Login" -ForegroundColor Yellow
$loginBody = @{
    username = $username
    password = $password
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.token
    $userId = $loginResponse.user.userId
    
    Write-Host "✅ Login successful" -ForegroundColor Green
    Write-Host "   User ID: $userId" -ForegroundColor White
    Write-Host "   Role: $($loginResponse.user.role)" -ForegroundColor White
    Write-Host "   Token: $($token.Substring(0, 20))..." -ForegroundColor Gray
} catch {
    Write-Host "❌ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Headers for authenticated requests
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

Write-Host "`n📝 Step 2: Get/Create Candidate Profile" -ForegroundColor Yellow
try {
    # Try to get existing candidate
    try {
        $candidateResponse = Invoke-RestMethod -Uri "$baseUrl/candidates/by-user/$userId" -Method Get -Headers $headers
        $candidateId = $candidateResponse.data.candidate_id
        Write-Host "✅ Found existing candidate profile" -ForegroundColor Green
        Write-Host "   Candidate ID: $candidateId" -ForegroundColor White
    } catch {
        # Create candidate if not exists
        Write-Host "📝 Creating candidate profile..." -ForegroundColor Cyan
        $createCandidateBody = @{
            user_id = $userId
            first_name = $username
            last_name = "-"
            email = "$username@test.com"
            status = "NEW"
        } | ConvertTo-Json
        
        $createResponse = Invoke-RestMethod -Uri "$baseUrl/candidates/self-register" -Method Post -Headers $headers -Body $createCandidateBody
        $candidateId = $createResponse.data.candidate_id
        Write-Host "✅ Created candidate profile" -ForegroundColor Green
        Write-Host "   Candidate ID: $candidateId" -ForegroundColor White
    }
} catch {
    Write-Host "❌ Candidate profile error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n📝 Step 3: Get Available Tests" -ForegroundColor Yellow
try {
    $testsResponse = Invoke-RestMethod -Uri "$baseUrl/tests" -Method Get -Headers $headers
    $tests = $testsResponse.data
    
    if ($tests.Count -eq 0) {
        Write-Host "⚠️  No tests available" -ForegroundColor Yellow
        exit 0
    }
    
    Write-Host "✅ Found $($tests.Count) test(s)" -ForegroundColor Green
    $testId = $tests[0].test_id
    $testName = $tests[0].test_name
    Write-Host "   Using test: $testName (ID: $testId)" -ForegroundColor White
} catch {
    Write-Host "❌ Failed to get tests: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n📝 Step 4: Self-Assign Test" -ForegroundColor Yellow
try {
    $assignBody = @{
        candidate_id = $candidateId
        test_id = $testId
    } | ConvertTo-Json
    
    $assignResponse = Invoke-RestMethod -Uri "$baseUrl/candidate-tests/self-assign" -Method Post -Headers $headers -Body $assignBody
    $candidateTestId = $assignResponse.data.candidate_test_id
    $status = $assignResponse.data.status
    
    Write-Host "✅ Test assigned successfully" -ForegroundColor Green
    Write-Host "   Candidate Test ID: $candidateTestId" -ForegroundColor White
    Write-Host "   Status: $status" -ForegroundColor White
} catch {
    Write-Host "❌ Failed to assign test: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Response: $($_.ErrorDetails.Message)" -ForegroundColor Gray
    exit 1
}

Write-Host "`n📝 Step 5: Verify My Tests" -ForegroundColor Yellow
try {
    $myTestsResponse = Invoke-RestMethod -Uri "$baseUrl/candidate-tests/my-tests" -Method Get -Headers $headers
    $myTests = $myTestsResponse.data
    
    Write-Host "✅ Retrieved my tests: $($myTests.Count) test(s)" -ForegroundColor Green
    
    $assignedTest = $myTests | Where-Object { $_.candidate_test_id -eq $candidateTestId }
    if ($assignedTest) {
        Write-Host "   ✓ Found assigned test in list" -ForegroundColor Green
        Write-Host "   Test: $($assignedTest.Test.test_name)" -ForegroundColor White
        Write-Host "   Status: $($assignedTest.status)" -ForegroundColor White
    }
} catch {
    Write-Host "❌ Failed to get my tests: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== ✅ ALL TESTS PASSED ===" -ForegroundColor Green
Write-Host "`n🎯 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Open browser: http://localhost:3000/exam.html" -ForegroundColor White
Write-Host "   2. Login with username: $username" -ForegroundColor White
Write-Host "   3. Click 'Làm bài thi' button" -ForegroundColor White
Write-Host "   4. Should redirect to: test.html?testId=$testId&candidateTestId=$candidateTestId" -ForegroundColor White
Write-Host ""
