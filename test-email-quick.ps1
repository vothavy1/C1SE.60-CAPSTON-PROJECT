# Quick Test - Update candidate 8 to HIRED
Write-Host "🧪 Testing Email System - PASS Email" -ForegroundColor Cyan
Write-Host ""

# Login first
Write-Host "1. Logging in..." -ForegroundColor Yellow
$loginBody = @{
    username = "Recruiter.vy"
    password = "12345"
} | ConvertTo-Json

try {
    $loginResp = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    $token = $loginResp.token
    Write-Host "   ✅ Login successful!" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "   ❌ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Update candidate status to HIRED
Write-Host "2. Updating candidate 8 to HIRED..." -ForegroundColor Yellow
$updateBody = @{
    status = "HIRED"
    notes = "Test email system with fixed account creation"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/candidates/8/status" `
        -Method PUT `
        -Headers @{ 
            "Authorization" = "Bearer $token"
            "Content-Type" = "application/json" 
        } `
        -Body $updateBody
    
    Write-Host "   ✅ SUCCESS!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Response:" -ForegroundColor Cyan
    Write-Host "   Message: $($response.message)" -ForegroundColor White
    Write-Host "   Status: $($response.data.old_status) -> $($response.data.new_status)" -ForegroundColor White
    Write-Host "   Email Sent: $($response.data.email_sent)" -ForegroundColor $(if($response.data.email_sent) {"Green"} else {"Red"})
    
    if ($response.data.account_created) {
        Write-Host "   Account Created: ✅ YES" -ForegroundColor Green
        Write-Host "   Username: $($response.data.username)" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "📧 Check email: $($response.data.email)" -ForegroundColor Yellow
    
} catch {
    Write-Host "   ❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        $errorObj = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "   Details: $($errorObj.message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Check backend logs:" -ForegroundColor Cyan
Write-Host "Get-Content backend\logs\combined.log -Tail 20" -ForegroundColor Gray
