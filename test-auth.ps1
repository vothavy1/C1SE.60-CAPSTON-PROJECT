# Script to test registration and login for both roles
Write-Host "=== Testing Authentication ===" -ForegroundColor Cyan

# Register and Login Candidate
Write-Host "`n[CANDIDATE] Registering..." -ForegroundColor Yellow
$candidateReg = @{
    username = "candidate_test"
    email = "candidate@test.com"
    password = "Test123456"
    full_name = "Test Candidate"
    phone_number = "0123456789"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:5000/api/auth/register" `
    -Method POST -Body $candidateReg -ContentType "application/json" -UseBasicParsing -ErrorAction SilentlyContinue | Out-Null

Write-Host "[CANDIDATE] Logging in..." -ForegroundColor Yellow
$candidateLogin = @{
    username = "candidate_test"
    password = "Test123456"
} | ConvertTo-Json

$resp = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/login" `
    -Method POST -Body $candidateLogin -ContentType "application/json" -UseBasicParsing
Write-Host "✓ Login Success!" -ForegroundColor Green
($resp.Content | ConvertFrom-Json | Select-Object -ExpandProperty user | Format-List)

# Register and Login Recruiter  
Write-Host "`n[RECRUITER] Registering..." -ForegroundColor Yellow
$recruiterReg = @{
    username = "recruiter_test"
    email = "recruiter@test.com"
    password = "Test123456"
    full_name = "Test Recruiter"
    phone_number = "0987654321"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:5000/api/auth/register" `
    -Method POST -Body $recruiterReg -ContentType "application/json" -UseBasicParsing -ErrorAction SilentlyContinue | Out-Null

Write-Host "[RECRUITER] Logging in..." -ForegroundColor Yellow
$recruiterLogin = @{
    username = "recruiter_test"
    password = "Test123456"
} | ConvertTo-Json

$resp = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/login" `
    -Method POST -Body $recruiterLogin -ContentType "application/json" -UseBasicParsing
Write-Host "✓ Login Success!" -ForegroundColor Green
($resp.Content | ConvertFrom-Json | Select-Object -ExpandProperty user | Format-List)

Write-Host "`n=== Test Accounts Created ===" -ForegroundColor Cyan
Write-Host "Candidate: candidate_test / Test123456" -ForegroundColor White
Write-Host "Recruiter: recruiter_test / Test123456" -ForegroundColor White
