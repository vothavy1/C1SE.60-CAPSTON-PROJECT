# Test Violation Reporting API
# PowerShell script to test all violation reporting endpoints

$baseUrl = "http://localhost:3000/api"

# Function to get auth token
function Get-AuthToken {
    Write-Host "`n=== Login to get token ===" -ForegroundColor Cyan
    $loginData = @{
        username = "admin"
        password = "admin123"
    } | ConvertTo-Json

    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginData -ContentType "application/json"
        Write-Host "✓ Login successful" -ForegroundColor Green
        return $response.data.token
    } catch {
        Write-Host "✗ Login failed: $_" -ForegroundColor Red
        return $null
    }
}

# Function to create a test violation
function Test-ReportViolation {
    param($token, $candidateTestId)
    
    Write-Host "`n=== Test: Report Violation ===" -ForegroundColor Cyan
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    $violationData = @{
        candidate_test_id = $candidateTestId
        violation_type = "TAB_SWITCH"
        description = "Candidate switched tabs 3 times during the test"
        event_count = 3
    } | ConvertTo-Json

    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/reports/violation" -Method Post -Headers $headers -Body $violationData
        Write-Host "✓ Violation reported successfully" -ForegroundColor Green
        Write-Host "Log ID: $($response.data.log_id)" -ForegroundColor Yellow
        return $response.data.log_id
    } catch {
        Write-Host "✗ Failed to report violation: $_" -ForegroundColor Red
        Write-Host $_.Exception.Response.StatusCode -ForegroundColor Red
        return $null
    }
}

# Function to get all violations
function Test-GetAllViolations {
    param($token)
    
    Write-Host "`n=== Test: Get All Violations ===" -ForegroundColor Cyan
    $headers = @{
        "Authorization" = "Bearer $token"
    }

    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/reports/violations" -Method Get -Headers $headers
        Write-Host "✓ Retrieved violations successfully" -ForegroundColor Green
        Write-Host "Total violations: $($response.count)" -ForegroundColor Yellow
        
        if ($response.data.Count -gt 0) {
            Write-Host "`nFirst 3 violations:" -ForegroundColor Cyan
            $response.data | Select-Object -First 3 | Format-Table -Property log_id, candidate_name, test_name, violation_type, event_count, event_time
        }
        
        return $response.data
    } catch {
        Write-Host "✗ Failed to get violations: $_" -ForegroundColor Red
        return $null
    }
}

# Function to get violations by type
function Test-GetViolationsByType {
    param($token, $violationType)
    
    Write-Host "`n=== Test: Get Violations by Type ($violationType) ===" -ForegroundColor Cyan
    $headers = @{
        "Authorization" = "Bearer $token"
    }

    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/reports/violations?violationType=$violationType" -Method Get -Headers $headers
        Write-Host "✓ Retrieved violations by type successfully" -ForegroundColor Green
        Write-Host "Total violations of type $violationType : $($response.count)" -ForegroundColor Yellow
        return $response.data
    } catch {
        Write-Host "✗ Failed to get violations by type: $_" -ForegroundColor Red
        return $null
    }
}

# Function to get violation by ID
function Test-GetViolationById {
    param($token, $logId)
    
    Write-Host "`n=== Test: Get Violation by ID ($logId) ===" -ForegroundColor Cyan
    $headers = @{
        "Authorization" = "Bearer $token"
    }

    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/reports/violations/$logId" -Method Get -Headers $headers
        Write-Host "✓ Retrieved violation details successfully" -ForegroundColor Green
        Write-Host "Violation details:" -ForegroundColor Yellow
        $response.data | Format-List
        return $response.data
    } catch {
        Write-Host "✗ Failed to get violation by ID: $_" -ForegroundColor Red
        return $null
    }
}

# Function to get violations by test
function Test-GetViolationsByTest {
    param($token, $candidateTestId)
    
    Write-Host "`n=== Test: Get Violations by Test ($candidateTestId) ===" -ForegroundColor Cyan
    $headers = @{
        "Authorization" = "Bearer $token"
    }

    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/reports/violations/test/$candidateTestId" -Method Get -Headers $headers
        Write-Host "✓ Retrieved test violations successfully" -ForegroundColor Green
        Write-Host "Total violations for test: $($response.count)" -ForegroundColor Yellow
        
        if ($response.data.Count -gt 0) {
            $response.data | Format-Table -Property log_id, event_type, event_count, event_time
        }
        
        return $response.data
    } catch {
        Write-Host "✗ Failed to get test violations: $_" -ForegroundColor Red
        return $null
    }
}

# Function to get violation statistics
function Test-GetViolationStatistics {
    param($token)
    
    Write-Host "`n=== Test: Get Violation Statistics ===" -ForegroundColor Cyan
    $headers = @{
        "Authorization" = "Bearer $token"
    }

    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/reports/violations-stats" -Method Get -Headers $headers
        Write-Host "✓ Retrieved violation statistics successfully" -ForegroundColor Green
        Write-Host "`nTotal Violations: $($response.data.total_violations)" -ForegroundColor Yellow
        
        Write-Host "`nViolations by Type:" -ForegroundColor Cyan
        $response.data.by_type | Format-Table -Property event_type, count, total_events
        
        Write-Host "`nTop Tests with Violations:" -ForegroundColor Cyan
        $response.data.top_tests_with_violations | Format-Table -Property candidate_test_id, violation_count
        
        return $response.data
    } catch {
        Write-Host "✗ Failed to get violation statistics: $_" -ForegroundColor Red
        return $null
    }
}

# Function to get test statistics
function Test-GetStatistics {
    param($token)
    
    Write-Host "`n=== Test: Get Test Statistics ===" -ForegroundColor Cyan
    $headers = @{
        "Authorization" = "Bearer $token"
    }

    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/reports/statistics" -Method Get -Headers $headers
        Write-Host "✓ Retrieved test statistics successfully" -ForegroundColor Green
        
        Write-Host "`nOverall Statistics:" -ForegroundColor Yellow
        Write-Host "Total Tests: $($response.data.totalTests)"
        Write-Host "Completed: $($response.data.completedTests)"
        Write-Host "Passed: $($response.data.passedTests)"
        Write-Host "Failed: $($response.data.failedTests)"
        Write-Host "Average Score: $($response.data.averageScore)"
        Write-Host "Total Violations: $($response.data.totalViolations)"
        
        Write-Host "`nScore Distribution:" -ForegroundColor Cyan
        $response.data.scoreDistribution | Format-List
        
        return $response.data
    } catch {
        Write-Host "✗ Failed to get statistics: $_" -ForegroundColor Red
        return $null
    }
}

# Main execution
Write-Host "========================================" -ForegroundColor Magenta
Write-Host "  VIOLATION REPORTING API TEST SUITE" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta

# Step 1: Login
$token = Get-AuthToken
if (-not $token) {
    Write-Host "`n✗ Cannot proceed without authentication token" -ForegroundColor Red
    exit 1
}

# Step 2: Get test statistics first to see current state
Test-GetStatistics -token $token

# Step 3: Get all violations (initial state)
$allViolations = Test-GetAllViolations -token $token

# Step 4: Report a new violation (using a test ID - adjust as needed)
Write-Host "`nNote: Using candidate_test_id = 1 for testing. Adjust if needed." -ForegroundColor Yellow
$testCandidateTestId = 1
$newLogId = Test-ReportViolation -token $token -candidateTestId $testCandidateTestId

# Step 5: Get violations by type
Test-GetViolationsByType -token $token -violationType "TAB_SWITCH"

# Step 6: Get violation by ID (if we created one)
if ($newLogId) {
    Test-GetViolationById -token $token -logId $newLogId
}

# Step 7: Get violations by test
if ($testCandidateTestId) {
    Test-GetViolationsByTest -token $token -candidateTestId $testCandidateTestId
}

# Step 8: Get violation statistics
Test-GetViolationStatistics -token $token

# Step 9: Get updated test statistics
Write-Host "`n=== Updated Test Statistics ===" -ForegroundColor Cyan
Test-GetStatistics -token $token

Write-Host "`n========================================" -ForegroundColor Magenta
Write-Host "  TEST SUITE COMPLETED" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta
