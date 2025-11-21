# =====================================================
# COMPLETE EMAIL TEST - Reset and Test
# =====================================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  COMPLETE EMAIL TEST - STEP BY STEP" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Login (try recruiter credentials)
Write-Host "[1/4] Logging in as recruiter..." -ForegroundColor Yellow
$loginBody = @{
    username = "havy@test.com"
    password = "123456"
} | ConvertTo-Json

try {
    $loginResp = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    $token = $loginResp.token
    Write-Host "      ✅ SUCCESS - Token: $($token.Substring(0,15))..." -ForegroundColor Green
} catch {
    Write-Host "      ❌ FAILED - Cannot login" -ForegroundColor Red
    Write-Host "      Error: $_" -ForegroundColor Red
    exit
}

Write-Host ""

# Step 2: Reset candidate #6 to NEW
Write-Host "[2/4] Resetting candidate #6 to NEW status..." -ForegroundColor Yellow
$resetBody = @{
    status = "NEW"
    notes = "Reset for email test"
} | ConvertTo-Json

try {
    $resetResp = Invoke-RestMethod -Uri "http://localhost:5000/api/candidates/6/status" -Method PUT `
        -Headers @{
            "Authorization" = "Bearer $token"
            "Content-Type" = "application/json"
        } `
        -Body $resetBody
    
    Write-Host "      ✅ SUCCESS - Candidate #6 reset to NEW" -ForegroundColor Green
} catch {
    Write-Host "      ❌ FAILED - Cannot reset status" -ForegroundColor Red
    Write-Host "      Error: $_" -ForegroundColor Red
    exit
}

Write-Host ""
Start-Sleep -Seconds 2

# Step 3: Test PASS (HIRED) - Should send email
Write-Host "[3/4] Testing PASS - Changing to HIRED (should send email)..." -ForegroundColor Yellow
$passBody = @{
    status = "HIRED"
    notes = "PASS - Email Test from Script"
} | ConvertTo-Json

try {
    $passResp = Invoke-RestMethod -Uri "http://localhost:5000/api/candidates/6/status" -Method PUT `
        -Headers @{
            "Authorization" = "Bearer $token"
            "Content-Type" = "application/json"
        } `
        -Body $passBody
    
    Write-Host "      ✅ SUCCESS!" -ForegroundColor Green
    Write-Host ""
    Write-Host "      📊 RESULT:" -ForegroundColor Cyan
    Write-Host "      Message: $($passResp.message)" -ForegroundColor White
    
    if ($passResp.data.email_sent) {
        Write-Host "      Email Sent: $($passResp.data.email_sent)" -ForegroundColor Green
    } else {
        Write-Host "      Email Sent: $($passResp.data.email_sent)" -ForegroundColor Red
    }
    
    if ($passResp.data.account_created) {
        Write-Host "      Account Created: $($passResp.data.account_created)" -ForegroundColor Green
    } else {
        Write-Host "      Account Created: $($passResp.data.account_created)" -ForegroundColor Yellow
    }
    
    if ($passResp.data.username) {
        Write-Host "      Username: $($passResp.data.username)" -ForegroundColor Cyan
    }
    
    if ($passResp.data.email) {
        Write-Host ""
        Write-Host "      📧 CHECK EMAIL: $($passResp.data.email)" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "      ❌ FAILED - Cannot update to HIRED" -ForegroundColor Red
    Write-Host "      Error: $_" -ForegroundColor Red
    exit
}

Write-Host ""
Start-Sleep -Seconds 2

# Step 4: Reset and test FAIL (REJECTED) - Should send email
Write-Host "[4/4] Testing FAIL - Resetting to NEW then REJECTED..." -ForegroundColor Yellow

# Reset to NEW first
$resetBody2 = @{
    status = "NEW"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/candidates/7/status" -Method PUT `
    -Headers @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    } `
    -Body $resetBody2 | Out-Null

Start-Sleep -Seconds 1

# Now test FAIL
$failBody = @{
    status = "REJECTED"
    notes = "FAIL - Email Test from Script"
} | ConvertTo-Json

try {
    $failResp = Invoke-RestMethod -Uri "http://localhost:5000/api/candidates/7/status" -Method PUT `
        -Headers @{
            "Authorization" = "Bearer $token"
            "Content-Type" = "application/json"
        } `
        -Body $failBody
    
    Write-Host "      ✅ SUCCESS!" -ForegroundColor Green
    Write-Host ""
    Write-Host "      📊 RESULT:" -ForegroundColor Cyan
    Write-Host "      Message: $($failResp.message)" -ForegroundColor White
    
    if ($failResp.data.email_sent) {
        Write-Host "      Email Sent: $($failResp.data.email_sent)" -ForegroundColor Green
    } else {
        Write-Host "      Email Sent: $($failResp.data.email_sent)" -ForegroundColor Red
    }
    
    if ($failResp.data.email) {
        Write-Host ""
        Write-Host "      📧 CHECK EMAIL: $($failResp.data.email)" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "      ❌ FAILED - Cannot update to REJECTED" -ForegroundColor Red
    Write-Host "      Error: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TEST COMPLETED!" -ForegroundColor Cyan
Write-Host "  Check the emails at:" -ForegroundColor Cyan
Write-Host "  - vothihavy792004@gmail.com (PASS)" -ForegroundColor Yellow
Write-Host "  - lengoctuan25122004@gmail.com (FAIL)" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
