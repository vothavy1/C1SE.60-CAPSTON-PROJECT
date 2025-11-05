# Test Register API
Write-Host "=== Testing Register API ===" -ForegroundColor Cyan
Write-Host ""

$testUser = @{
    username = "testuser_$(Get-Random)"
    email = "testuser_$(Get-Random)@test.com"
    password = "Test123456"
    full_name = "Test User"
    role_id = 4
}

Write-Host "Testing registration with:" -ForegroundColor Yellow
Write-Host "  Email: $($testUser.email)" -ForegroundColor Gray
Write-Host "  Username: $($testUser.username)" -ForegroundColor Gray
Write-Host "  Role: Candidate (4)" -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" `
        -Method POST `
        -ContentType "application/json" `
        -Body ($testUser | ConvertTo-Json)
    
    Write-Host "SUCCESS!" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Yellow
    $response | ConvertTo-Json -Depth 3
    
} catch {
    Write-Host "FAILED!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.ErrorDetails.Message) {
        Write-Host "Details:" -ForegroundColor Yellow
        $_.ErrorDetails.Message | ConvertFrom-Json | ConvertTo-Json -Depth 3
    }
}

Write-Host ""
Write-Host "Now test login..." -ForegroundColor Cyan

Start-Sleep -Seconds 2

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body (@{
            email = $testUser.email
            password = $testUser.password
        } | ConvertTo-Json)
    
    Write-Host "LOGIN SUCCESS!" -ForegroundColor Green
    Write-Host "Token: $($loginResponse.token.Substring(0,30))..." -ForegroundColor Gray
    
} catch {
    Write-Host "LOGIN FAILED!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}
