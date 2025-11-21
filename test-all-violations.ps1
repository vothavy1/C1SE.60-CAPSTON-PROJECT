# Test Violations API - ALL TESTS (with and without violations)
# Should show all completed candidate tests

Write-Host "=== Testing Violations API - ALL TESTS ===" -ForegroundColor Cyan
Write-Host ""

# Login as admin
Write-Host "1. Logging in as admin..." -ForegroundColor Yellow
$loginBody = @{
    email = "admin@cs60.com"
    password = "admin123"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -ContentType "application/json" -Body $loginBody

$token = $loginResponse.token
Write-Host "Login successful" -ForegroundColor Green
Write-Host ""

# Get all violations
Write-Host "2. Fetching ALL violations..." -ForegroundColor Yellow
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/reports/violations" -Method GET -Headers $headers
    
    Write-Host "API Response Successful" -ForegroundColor Green
    Write-Host ""
    
    # Count violations
    $totalTests = $response.violations.Count
    $testsWithViolations = @($response.violations | Where-Object { $_.has_violations -eq $true }).Count
    $cleanTests = @($response.violations | Where-Object { $_.has_violations -eq $false }).Count
    
    Write-Host "SUMMARY:" -ForegroundColor Cyan
    Write-Host "  Total Tests: $totalTests" -ForegroundColor White
    Write-Host "  Tests WITH Violations: $testsWithViolations" -ForegroundColor Red
    Write-Host "  Clean Tests: $cleanTests" -ForegroundColor Green
    Write-Host ""
    
    # Show first 10 tests
    Write-Host "First 10 Tests:" -ForegroundColor Cyan
    $response.violations | Select-Object -First 10 | ForEach-Object {
        $violationIcon = if ($_.has_violations) { "[X]" } else { "[OK]" }
        $color = if ($_.has_violations) { "Red" } else { "Green" }
        
        Write-Host "$violationIcon $($_.candidate_name) - $($_.test_name)" -ForegroundColor $color
        Write-Host "    Type: $($_.violation_type) | Count: $($_.violation_count) | Score: $($_.score)" -ForegroundColor Gray
        Write-Host ""
    }
    
    Write-Host "TEST PASSED - All tests displayed!" -ForegroundColor Green
    
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}
