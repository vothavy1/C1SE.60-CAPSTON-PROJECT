# Test Violations Report Feature
Write-Host "=== Testing Violations Report Feature ===" -ForegroundColor Cyan
Write-Host ""

# 1. Check violations.json file
Write-Host "1. Checking violations.json file..." -ForegroundColor Yellow
$violationsFile = "backend\reports\violations.json"
if (Test-Path $violationsFile) {
    $content = Get-Content $violationsFile | ConvertFrom-Json
    Write-Host "   Found $($content.Count) violations in file" -ForegroundColor Green
    Write-Host "   Sample violation:" -ForegroundColor Cyan
    Write-Host "   - ID: $($content[0].id)"
    Write-Host "   - Candidate: $($content[0].candidate_name)"
    Write-Host "   - Test: $($content[0].test_name)"
    Write-Host "   - Type: $($content[0].violation_type)"
    Write-Host "   - Score: $($content[0].score)"
} else {
    Write-Host "   ERROR: violations.json not found!" -ForegroundColor Red
}

Write-Host ""

# 2. Test Backend API
Write-Host "2. Testing Backend API..." -ForegroundColor Yellow

# Login first
Write-Host "   Logging in as recruiter..." -ForegroundColor Gray
$loginBody = @{
    email = "recruiter@cs60.com"
    password = "Recruiter@123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    if ($loginResponse.success) {
        Write-Host "   Login successful!" -ForegroundColor Green
        $token = $loginResponse.token
        
        # Get violations
        Write-Host "   Fetching violations from API..." -ForegroundColor Gray
        $headers = @{
            "Authorization" = "Bearer $token"
        }
        
        $violationsResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/reports/violations" -Method Get -Headers $headers
        
        if ($violationsResponse.success) {
            Write-Host "   API returned $($violationsResponse.data.Count) violations" -ForegroundColor Green
            Write-Host ""
            Write-Host "   Sample violation from API:" -ForegroundColor Cyan
            $sample = $violationsResponse.data[0]
            Write-Host "   - ID: $($sample.id)"
            Write-Host "   - Candidate ID: $($sample.candidateId)"
            Write-Host "   - Candidate Name: $($sample.candidate_name)"
            Write-Host "   - Test Name: $($sample.test_name)"
            Write-Host "   - Violation Type: $($sample.violation_type)"
            Write-Host "   - Score: $($sample.score)"
            Write-Host "   - Result: $($sample.result)"
            Write-Host "   - Reported At: $($sample.reported_at)"
        } else {
            Write-Host "   ERROR: API returned error" -ForegroundColor Red
        }
        
        # Test filter
        Write-Host ""
        Write-Host "   Testing filter by type (tab_switch)..." -ForegroundColor Gray
        $filteredResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/reports/violations?violationType=tab_switch" -Method Get -Headers $headers
        Write-Host "   Filtered result: $($filteredResponse.data.Count) violations" -ForegroundColor Green
        
    } else {
        Write-Host "   ERROR: Login failed" -ForegroundColor Red
    }
} catch {
    Write-Host "   ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Test Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Open http://localhost:3000/report.html" -ForegroundColor White
Write-Host "2. Login with recruiter account" -ForegroundColor White
Write-Host "3. Click on 'Vi Pham' tab" -ForegroundColor White
Write-Host "4. You should see 7 violations with full details" -ForegroundColor White
Write-Host "5. Try the filter dropdown to filter by violation type" -ForegroundColor White
