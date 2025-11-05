# Test Violations API - ALL TESTS (with and without violations)
# Should show all completed candidate tests

Write-Host "=== Testing Violations API - ALL TESTS ===" -ForegroundColor Cyan
Write-Host ""

# Login as recruiter
Write-Host "1. Logging in as recruiter_test..." -ForegroundColor Yellow
$loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -ContentType "application/json" -Body (@{
    email = "recruiter_test@test.com"
    password = "123456"
} | ConvertTo-Json)

$token = $loginResponse.token
Write-Host "✓ Login successful" -ForegroundColor Green
Write-Host "Token: $($token.Substring(0,20))..." -ForegroundColor Gray
Write-Host ""

# Get all violations (should include tests without violations)
Write-Host "2. Fetching ALL violations..." -ForegroundColor Yellow
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/reports/violations" -Method GET -Headers $headers
    
    Write-Host "✓ API Response Successful" -ForegroundColor Green
    Write-Host ""
    
    # Count violations
    $totalTests = $response.violations.Count
    $testsWithViolations = ($response.violations | Where-Object { $_.has_violations -eq $true }).Count
    $cleanTests = ($response.violations | Where-Object { $_.has_violations -eq $false }).Count
    
    Write-Host "📊 SUMMARY:" -ForegroundColor Cyan
    Write-Host "  Total Tests: $totalTests" -ForegroundColor White
    Write-Host "  Tests WITH Violations: $testsWithViolations" -ForegroundColor Red
    Write-Host "  Clean Tests (no violations): $cleanTests" -ForegroundColor Green
    Write-Host ""
    
    # Show first 10 tests
    Write-Host "📋 First 10 Tests:" -ForegroundColor Cyan
    $response.violations | Select-Object -First 10 | ForEach-Object {
        $violationIcon = if ($_.has_violations) { "⚠️" } else { "✅" }
        $violationType = if ($_.violation_type -eq "NONE") { "No violations" } else { $_.violation_type }
        
        Write-Host "$violationIcon $($_.candidate_name) - $($_.test_name)" -ForegroundColor $(if ($_.has_violations) { "Red" } else { "Green" })
        Write-Host "    Violation: $violationType ($($_.violation_count) times)" -ForegroundColor Gray
        Write-Host "    Score: $($_.score) | Status: $($_.status) | $($_.violation_summary)" -ForegroundColor Gray
        Write-Host ""
    }
    
    # Show tests grouped by violation status
    Write-Host "🔍 BREAKDOWN:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Tests WITH Violations:" -ForegroundColor Red
    $response.violations | Where-Object { $_.has_violations -eq $true } | ForEach-Object {
        $violationText = "$($_.violation_count) times"
        Write-Host "  - $($_.candidate_name): $($_.violation_type) ($violationText) in '$($_.test_name)'" -ForegroundColor Yellow
    }
    Write-Host ""
    
    Write-Host "Clean Tests (first 10):" -ForegroundColor Green
    $cleanTestsList = $response.violations | Where-Object { $_.has_violations -eq $false }
    $cleanTestsList | Select-Object -First 10 | ForEach-Object {
        Write-Host "  - $($_.candidate_name): '$($_.test_name)' - Score: $($_.score)" -ForegroundColor Gray
    }
    
    Write-Host ""
    Write-Host "✓ TEST PASSED - All tests displayed!" -ForegroundColor Green
    
}
catch {
    Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host $_.Exception -ForegroundColor Red
}
