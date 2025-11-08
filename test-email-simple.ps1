# =====================================================
# SIMPLE EMAIL TEST
# =====================================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  EMAIL TEST - Reset & Send" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Login
Write-Host "`n[1] Login..."
$loginBody = @{ username = "havy@test.com"; password = "123456" } | ConvertTo-Json
$loginResp = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
$token = $loginResp.token
Write-Host "    ✅ Logged in!" -ForegroundColor Green

# Reset candidate #6 to NEW
Write-Host "`n[2] Reset candidate #6 to NEW..."
$resetBody = @{ status = "NEW" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:5000/api/candidates/6/status" -Method PUT `
    -Headers @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/json" } `
    -Body $resetBody | Out-Null
Write-Host "    ✅ Reset to NEW" -ForegroundColor Green
Start-Sleep -Seconds 1

# Test PASS (should send email)
Write-Host "`n[3] Test PASS - Change to HIRED (should send email)..."
$passBody = @{ status = "HIRED"; notes = "TEST PASS" } | ConvertTo-Json
$passResp = Invoke-RestMethod -Uri "http://localhost:5000/api/candidates/6/status" -Method PUT `
    -Headers @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/json" } `
    -Body $passBody

Write-Host "    ✅ SUCCESS!" -ForegroundColor Green
Write-Host "    Message: $($passResp.message)"
Write-Host "    Email Sent: $($passResp.data.email_sent)" -ForegroundColor $(if ($passResp.data.email_sent) { "Green" } else { "Red" })
Write-Host "    Account Created: $($passResp.data.account_created)" -ForegroundColor $(if ($passResp.data.account_created) { "Green" } else { "Yellow" })
if ($passResp.data.username) {
    Write-Host "    Username: $($passResp.data.username)" -ForegroundColor Cyan
}
if ($passResp.data.email) {
    Write-Host "    EMAIL: $($passResp.data.email)" -ForegroundColor Yellow
}

# Reset candidate #7 to NEW
Write-Host "`n[4] Reset candidate #7 to NEW..."
$resetBody2 = @{ status = "NEW" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:5000/api/candidates/7/status" -Method PUT `
    -Headers @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/json" } `
    -Body $resetBody2 | Out-Null
Write-Host "    ✅ Reset to NEW" -ForegroundColor Green
Start-Sleep -Seconds 1

# Test FAIL (should send email)
Write-Host "`n[5] Test FAIL - Change to REJECTED (should send email)..."
$failBody = @{ status = "REJECTED"; notes = "TEST FAIL" } | ConvertTo-Json
$failResp = Invoke-RestMethod -Uri "http://localhost:5000/api/candidates/7/status" -Method PUT `
    -Headers @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/json" } `
    -Body $failBody

Write-Host "    ✅ SUCCESS!" -ForegroundColor Green
Write-Host "    Message: $($failResp.message)"
Write-Host "    Email Sent: $($failResp.data.email_sent)" -ForegroundColor $(if ($failResp.data.email_sent) { "Green" } else { "Red" })
if ($failResp.data.email) {
    Write-Host "    EMAIL: $($failResp.data.email)" -ForegroundColor Yellow
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  TEST COMPLETE!" -ForegroundColor Cyan
Write-Host "  Check emails at:" -ForegroundColor Cyan
Write-Host "  - vothihavy792004@gmail.com (PASS)" -ForegroundColor Yellow
Write-Host "  - lengoctuan25122004@gmail.com (FAIL)" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
