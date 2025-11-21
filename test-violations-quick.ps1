# Test Violations API directly with curl
Write-Host "=== Testing Violations API ===" -ForegroundColor Cyan

# First, try to get recruiter token from test-report-admin.ps1 if exists
$tokenFile = "temp_token.txt"
if (Test-Path $tokenFile) {
    $token = Get-Content $tokenFile -Raw
    Write-Host "Using saved token..." -ForegroundColor Yellow
} else {
    Write-Host "No saved token found. Please login first." -ForegroundColor Red
    Write-Host "Run: .\test-report-admin.ps1" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Fetching violations..." -ForegroundColor Yellow

$headers = @{
    "Authorization" = "Bearer $token"
}

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/reports/violations" -Method GET -Headers $headers
    
    Write-Host "SUCCESS!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Total Tests: $($response.violations.Count)" -ForegroundColor Cyan
    
    $withViolations = @($response.violations | Where-Object { $_.has_violations -eq $true }).Count
    $noViolations = @($response.violations | Where-Object { $_.has_violations -eq $false }).Count
    
    Write-Host "Tests WITH violations: $withViolations" -ForegroundColor Red
    Write-Host "Tests WITHOUT violations: $noViolations" -ForegroundColor Green
    Write-Host ""
    
    # Show sample
    Write-Host "Sample tests:" -ForegroundColor Cyan
    $response.violations | Select-Object -First 5 | ForEach-Object {
        $icon = if ($_.has_violations) { "[X]" } else { "[OK]" }
        Write-Host "$icon $($_.candidate_name) - $($_.test_name) - Type: $($_.violation_type)" 
    }
    
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Yellow
    }
}
