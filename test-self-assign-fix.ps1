# Test script to verify self-assign fix for "unknown column updated_at" error
Write-Host "=== Testing Self-Assign Fix ===" -ForegroundColor Cyan

# Configuration
$baseUrl = "http://localhost:5000/api"

# Step 1: Login as candidate
Write-Host "`n1️⃣ Logging in as candidate..." -ForegroundColor Yellow
$loginBody = @{
    username = "havy@test.com"
    password = "123456"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.data.token
    $userId = $loginResponse.data.user.user_id
    Write-Host "   ✅ Login successful" -ForegroundColor Green
    Write-Host "   User ID: $userId" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 2: Get candidate profile
Write-Host "`n2️⃣ Getting candidate profile..." -ForegroundColor Yellow
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

try {
    $candidateResponse = Invoke-RestMethod -Uri "$baseUrl/candidates/by-user/$userId" -Method GET -Headers $headers
    $candidateId = $candidateResponse.data.candidate_id
    Write-Host "   ✅ Candidate profile found" -ForegroundColor Green
    Write-Host "   Candidate ID: $candidateId" -ForegroundColor Gray
    Write-Host "   Name: $($candidateResponse.data.first_name) $($candidateResponse.data.last_name)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Failed to get candidate profile: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 3: Get available tests
Write-Host "`n3️⃣ Getting available tests..." -ForegroundColor Yellow
try {
    $testsResponse = Invoke-RestMethod -Uri "$baseUrl/tests?status=ACTIVE&page=1&limit=1" -Method GET -Headers $headers
    if ($testsResponse.data -and $testsResponse.data.Count -gt 0) {
        $testId = $testsResponse.data[0].test_id
        $testName = $testsResponse.data[0].test_name
        Write-Host "   ✅ Found active test" -ForegroundColor Green
        Write-Host "   Test ID: $testId" -ForegroundColor Gray
        Write-Host "   Test Name: $testName" -ForegroundColor Gray
    } else {
        Write-Host "   ⚠️ No active tests found. Creating a sample test..." -ForegroundColor Yellow
        # Use a known test ID if it exists
        $testId = 1
        Write-Host "   Using Test ID: $testId" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ⚠️ Could not get tests list, using default test ID = 1" -ForegroundColor Yellow
    $testId = 1
}

# Step 4: Self-assign test (This is where the error was happening)
Write-Host "`n4️⃣ Self-assigning test... (Testing the fix)" -ForegroundColor Yellow
$assignBody = @{
    candidate_id = $candidateId
    test_id = $testId
} | ConvertTo-Json

Write-Host "   Request body:" -ForegroundColor Gray
Write-Host "   $assignBody" -ForegroundColor Gray

try {
    $assignResponse = Invoke-RestMethod -Uri "$baseUrl/candidate-tests/self-assign" -Method POST -Headers $headers -Body $assignBody
    
    Write-Host "`n   ✅ SUCCESS! Test assigned without error" -ForegroundColor Green
    Write-Host "   Response:" -ForegroundColor Cyan
    Write-Host "   - success: $($assignResponse.success)" -ForegroundColor Gray
    Write-Host "   - message: $($assignResponse.message)" -ForegroundColor Gray
    Write-Host "   - candidate_test_id: $($assignResponse.data.candidate_test_id)" -ForegroundColor Gray
    Write-Host "   - status: $($assignResponse.data.status)" -ForegroundColor Gray
    
} catch {
    $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue
    
    Write-Host "`n   ❌ FAILED: Self-assign error" -ForegroundColor Red
    Write-Host "   Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    
    if ($errorDetails) {
        Write-Host "   Error Message: $($errorDetails.message)" -ForegroundColor Red
        Write-Host "   Error Detail: $($errorDetails.error)" -ForegroundColor Red
        
        if ($errorDetails.error -like "*updated_at*") {
            Write-Host "`n   ⚠️ Still getting 'updated_at' error!" -ForegroundColor Yellow
            Write-Host "   Make sure to restart the backend server after the fix." -ForegroundColor Yellow
        }
    } else {
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    exit 1
}

# Step 5: Verify the assigned test
Write-Host "`n5️⃣ Verifying assigned test..." -ForegroundColor Yellow
try {
    $myTestsResponse = Invoke-RestMethod -Uri "$baseUrl/candidate-tests/my-tests" -Method GET -Headers $headers
    
    $assignedTest = $myTestsResponse.data | Where-Object { $_.test_id -eq $testId } | Select-Object -First 1
    
    if ($assignedTest) {
        Write-Host "   ✅ Test verification successful" -ForegroundColor Green
        Write-Host "   Assigned test found in my-tests list:" -ForegroundColor Gray
        Write-Host "   - candidate_test_id: $($assignedTest.candidate_test_id)" -ForegroundColor Gray
        Write-Host "   - status: $($assignedTest.status)" -ForegroundColor Gray
        Write-Host "   - test_name: $($assignedTest.Test.test_name)" -ForegroundColor Gray
    } else {
        Write-Host "   ⚠️ Test not found in my-tests list" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ⚠️ Could not verify: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host "`n=== Test Complete ===" -ForegroundColor Cyan
Write-Host "✅ The 'unknown column updated_at' error has been FIXED!" -ForegroundColor Green
Write-Host "`nFixed files:" -ForegroundColor Cyan
Write-Host "  1. backend/src/models/candidateTest.model.js" -ForegroundColor Gray
Write-Host "  2. backend/src/models/candidateTestAnswer.model.js" -ForegroundColor Gray
Write-Host "`nChanges made:" -ForegroundColor Cyan
Write-Host "  - Disabled 'updatedAt' field in Sequelize models" -ForegroundColor Gray
Write-Host "  - Database tables don't have 'updated_at' column" -ForegroundColor Gray
Write-Host "`n⚠️ Important: If you still see errors, restart the backend:" -ForegroundColor Yellow
Write-Host "   cd backend" -ForegroundColor Gray
Write-Host "   npm start" -ForegroundColor Gray
