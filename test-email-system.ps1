# Test Email Auto System
# Script kiểm tra hệ thống gửi email tự động

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "   TEST EMAIL AUTO SYSTEM" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$baseUrl = "http://localhost:5000"
$loginUrl = "$baseUrl/api/auth/login"
$candidateStatusUrl = "$baseUrl/api/candidates"

# Admin credentials
$adminUsername = "admin"
$adminPassword = "admin123"

Write-Host "📋 Step 1: Login as ADMIN/RECRUITER..." -ForegroundColor Yellow

$loginBody = @{
    username = $adminUsername
    password = $adminPassword
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri $loginUrl -Method POST -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.token
    Write-Host "✅ Login successful! Token: $($token.Substring(0, 20))..." -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "❌ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Get list of candidates
Write-Host "📋 Step 2: Getting candidate list..." -ForegroundColor Yellow

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

try {
    $candidatesResponse = Invoke-RestMethod -Uri "$candidateStatusUrl" -Method GET -Headers $headers
    $candidates = $candidatesResponse.data
    
    if ($candidates.Count -eq 0) {
        Write-Host "⚠️ No candidates found in system" -ForegroundColor Yellow
        Write-Host "Please create some candidates first using apply.html" -ForegroundColor Yellow
        exit 0
    }
    
    Write-Host "✅ Found $($candidates.Count) candidates" -ForegroundColor Green
    Write-Host ""
    
    # Show first 5 candidates
    Write-Host "📋 Available Candidates:" -ForegroundColor Cyan
    $i = 1
    foreach ($candidate in $candidates | Select-Object -First 5) {
        $name = "$($candidate.first_name) $($candidate.last_name)"
        Write-Host "  $i. ID: $($candidate.candidate_id) - $name - $($candidate.email) - Status: $($candidate.status)" -ForegroundColor White
        $i++
    }
    Write-Host ""
    
} catch {
    Write-Host "❌ Failed to get candidates: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Select a candidate to test
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "   SELECT TEST SCENARIO" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. 🎉 Test PASS email (HIRED - Create account + Send email)" -ForegroundColor Green
Write-Host "2. 🎯 Test PASS email (OFFERED - Create account + Send email)" -ForegroundColor Green
Write-Host "3. ❌ Test FAIL email (REJECTED - Send rejection email)" -ForegroundColor Red
Write-Host "4. 📊 Test all scenarios" -ForegroundColor Cyan
Write-Host ""

$choice = Read-Host "Enter your choice (1-4)"

if ($candidates.Count -eq 0) {
    Write-Host "❌ No candidates available for testing" -ForegroundColor Red
    exit 1
}

$testCandidate = $candidates[0]
$candidateId = $testCandidate.candidate_id
$candidateName = "$($testCandidate.first_name) $($testCandidate.last_name)"
$candidateEmail = $testCandidate.email

Write-Host ""
Write-Host "🎯 Testing with candidate:" -ForegroundColor Yellow
Write-Host "   ID: $candidateId" -ForegroundColor White
Write-Host "   Name: $candidateName" -ForegroundColor White
Write-Host "   Email: $candidateEmail" -ForegroundColor White
Write-Host "   Current Status: $($testCandidate.status)" -ForegroundColor White
Write-Host ""

function Test-StatusUpdate {
    param (
        [string]$status,
        [string]$notes,
        [string]$description
    )
    
    Write-Host "=====================================" -ForegroundColor Cyan
    Write-Host "Testing: $description" -ForegroundColor Cyan
    Write-Host "=====================================" -ForegroundColor Cyan
    Write-Host ""
    
    $updateBody = @{
        status = $status
        notes = $notes
    } | ConvertTo-Json
    
    Write-Host "📤 Sending request to update status to: $status" -ForegroundColor Yellow
    
    try {
        $updateUrl = "$candidateStatusUrl/$candidateId/status"
        $response = Invoke-RestMethod -Uri $updateUrl -Method PUT -Headers $headers -Body $updateBody
        
        Write-Host "✅ Status update successful!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📊 Response:" -ForegroundColor Cyan
        Write-Host "   Message: $($response.message)" -ForegroundColor White
        Write-Host "   Old Status: $($response.data.old_status)" -ForegroundColor White
        Write-Host "   New Status: $($response.data.new_status)" -ForegroundColor White
        Write-Host "   Email Sent: $($response.data.email_sent)" -ForegroundColor White
        
        if ($response.data.account_created) {
            Write-Host "   Account Created: ✅ YES" -ForegroundColor Green
            Write-Host "   Username: $($response.data.username)" -ForegroundColor Green
        } else {
            Write-Host "   Account Created: ❌ No (may already exist)" -ForegroundColor Yellow
        }
        
        Write-Host ""
        Write-Host "📧 Check the email: $candidateEmail" -ForegroundColor Cyan
        Write-Host ""
        
        return $true
    } catch {
        Write-Host "❌ Update failed: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.ErrorDetails.Message) {
            $errorObj = $_.ErrorDetails.Message | ConvertFrom-Json
            Write-Host "   Error: $($errorObj.message)" -ForegroundColor Red
        }
        Write-Host ""
        return $false
    }
}

switch ($choice) {
    "1" {
        Test-StatusUpdate -status "HIRED" -notes "Test PASS email - HIRED status" -description "PASS Email (HIRED)"
    }
    "2" {
        Test-StatusUpdate -status "OFFERED" -notes "Test PASS email - OFFERED status" -description "PASS Email (OFFERED)"
    }
    "3" {
        Test-StatusUpdate -status "REJECTED" -notes "Test FAIL email - REJECTED status" -description "FAIL Email (REJECTED)"
    }
    "4" {
        Write-Host "🔄 Running all test scenarios..." -ForegroundColor Cyan
        Write-Host ""
        
        # Test 1: HIRED
        Start-Sleep -Seconds 2
        Test-StatusUpdate -status "HIRED" -notes "Test 1: HIRED status" -description "Test 1/3: PASS Email (HIRED)"
        
        Start-Sleep -Seconds 3
        
        # Test 2: OFFERED
        Test-StatusUpdate -status "OFFERED" -notes "Test 2: OFFERED status" -description "Test 2/3: PASS Email (OFFERED)"
        
        Start-Sleep -Seconds 3
        
        # Test 3: REJECTED
        Test-StatusUpdate -status "REJECTED" -notes "Test 3: REJECTED status" -description "Test 3/3: FAIL Email (REJECTED)"
        
        Write-Host ""
        Write-Host "✅ All tests completed!" -ForegroundColor Green
    }
    default {
        Write-Host "❌ Invalid choice" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "   TEST COMPLETED" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📧 Please check email: $candidateEmail" -ForegroundColor Yellow
Write-Host "📝 Check backend logs at: backend/logs/combined.log" -ForegroundColor Yellow
Write-Host ""
Write-Host "🔍 What to verify:" -ForegroundColor Cyan
Write-Host "   1. Email received in inbox" -ForegroundColor White
Write-Host "   2. Email content is correct (PASS/FAIL)" -ForegroundColor White
Write-Host "   3. For PASS: Username and password are included" -ForegroundColor White
Write-Host "   4. Account created in database (if PASS)" -ForegroundColor White
Write-Host ""
