# Test Email System - Quick Test
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  TEST EMAIL SYSTEM - QUICK TEST" -ForegroundColor Cyan  
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Login
Write-Host "[1/3] Logging in as Recruiter..." -ForegroundColor Yellow
$loginBody = @{
    username = "Recruiter.vy"
    password = "12345"
} | ConvertTo-Json

try {
    $loginResp = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    $token = $loginResp.token
    Write-Host "      SUCCESS - Token received!" -ForegroundColor Green
} catch {
    Write-Host "      FAILED - Cannot login: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 2: Get candidate 6 info (Vo Thi Ha Vy)
Write-Host "[2/3] Getting candidate 6 info..." -ForegroundColor Yellow
try {
    $candidate = Invoke-RestMethod -Uri "http://localhost:5000/api/candidates/6" `
        -Method GET `
        -Headers @{ "Authorization" = "Bearer $token" }
    
    Write-Host "      Name: $($candidate.data.first_name) $($candidate.data.last_name)" -ForegroundColor White
    Write-Host "      Email: $($candidate.data.email)" -ForegroundColor White
    Write-Host "      Current Status: $($candidate.data.status)" -ForegroundColor White
} catch {
    Write-Host "      FAILED - Cannot get candidate: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 3: Update to OFFERED (PASS)
Write-Host "[3/3] Updating candidate 6 to OFFERED (PASS)..." -ForegroundColor Yellow
$updateBody = @{
    status = "OFFERED"
    notes = "Test email system - Should create account and send email"
} | ConvertTo-Json

try {
    $result = Invoke-RestMethod -Uri "http://localhost:5000/api/candidates/6/status" `
        -Method PUT `
        -Headers @{ 
            "Authorization" = "Bearer $token"
            "Content-Type" = "application/json"
        } `
        -Body $updateBody
    
    Write-Host ""
    Write-Host "==================================" -ForegroundColor Green
    Write-Host "  RESULT" -ForegroundColor Green
    Write-Host "==================================" -ForegroundColor Green
    Write-Host "Message: $($result.message)" -ForegroundColor Cyan
    Write-Host "Old Status: $($result.data.old_status)" -ForegroundColor Yellow
    Write-Host "New Status: $($result.data.new_status)" -ForegroundColor Green
    Write-Host "Email Sent: $($result.data.email_sent)" -ForegroundColor $(if($result.data.email_sent) {"Green"} else {"Red"})
    
    if ($result.data.account_created) {
        Write-Host ""
        Write-Host "Account Created: YES" -ForegroundColor Green
        Write-Host "Username: $($result.data.username)" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "CHECK EMAIL: $($result.data.email)" -ForegroundColor Yellow -BackgroundColor Blue
    } else {
        Write-Host "Account Created: NO (may already exist)" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "==================================" -ForegroundColor Green
    
} catch {
    Write-Host "      FAILED: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        $err = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "      Error: $($err.message)" -ForegroundColor Red
    }
    exit 1
}

Write-Host ""
Write-Host "Check backend logs:" -ForegroundColor Cyan
Write-Host "Get-Content backend\logs\combined.log -Tail 20" -ForegroundColor Gray
