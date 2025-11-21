# Test Apply System - Updated Version
# Test the new position and company_name fields

Write-Host "=== Testing Updated Apply System ===" -ForegroundColor Cyan
Write-Host ""

# API Base URL
$API_BASE = "http://localhost:5000/api"

# Test 1: Submit application with new fields
Write-Host "Test 1: Submitting CV with position and company_name..." -ForegroundColor Yellow

# Create a temporary test CV file
$testCvPath = "test-cv-temp.pdf"
"Test CV Content - This is a sample CV" | Out-File -FilePath $testCvPath -Encoding ASCII

try {
    # Prepare multipart form data
    $boundary = [System.Guid]::NewGuid().ToString()
    $contentType = "multipart/form-data; boundary=$boundary"
    
    # Build form data manually
    $bodyLines = @(
        "--$boundary",
        "Content-Disposition: form-data; name=`"first_name`"",
        "",
        "Nguyễn Văn",
        "--$boundary",
        "Content-Disposition: form-data; name=`"last_name`"",
        "",
        "Test Apply",
        "--$boundary",
        "Content-Disposition: form-data; name=`"email`"",
        "",
        "test.apply.$(Get-Date -Format 'HHmmss')@test.com",
        "--$boundary",
        "Content-Disposition: form-data; name=`"phone`"",
        "",
        "0912345678",
        "--$boundary",
        "Content-Disposition: form-data; name=`"position`"",
        "",
        "Intern Developer",
        "--$boundary",
        "Content-Disposition: form-data; name=`"company_name`"",
        "",
        "FPT Software",
        "--$boundary",
        "Content-Disposition: form-data; name=`"experience_years`"",
        "",
        "0",
        "--$boundary",
        "Content-Disposition: form-data; name=`"cv`"; filename=`"test-cv.pdf`"",
        "Content-Type: application/pdf",
        "",
        "Test CV Content - This is a sample CV",
        "--$boundary--"
    )
    
    $body = $bodyLines -join "`r`n"
    
    $response = Invoke-RestMethod -Uri "$API_BASE/apply" -Method Post -ContentType $contentType -Body $body
    
    Write-Host "✅ CV submitted successfully!" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json -Depth 3)" -ForegroundColor Gray
    
} catch {
    Write-Host "❌ Error submitting CV: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.ErrorDetails.Message)" -ForegroundColor Red
} finally {
    # Clean up test file
    if (Test-Path $testCvPath) {
        Remove-Item $testCvPath
    }
}

Write-Host ""
Write-Host "Test 2: Checking candidate list..." -ForegroundColor Yellow

# Get recruiter token
$loginBody = @{
    email = "recruiter.vy@gmail.com"
    password = "123456"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$API_BASE/auth/login" -Method Post -ContentType "application/json" -Body $loginBody
    $token = $loginResponse.token
    
    Write-Host "✅ Login successful" -ForegroundColor Green
    
    # Get candidates
    $headers = @{
        "Authorization" = "Bearer $token"
    }
    
    $candidates = Invoke-RestMethod -Uri "$API_BASE/candidates" -Method Get -Headers $headers
    
    Write-Host "✅ Retrieved $($candidates.data.Count) candidates" -ForegroundColor Green
    
    # Show last 3 candidates with new fields
    Write-Host ""
    Write-Host "Last 3 candidates:" -ForegroundColor Cyan
    $candidates.data | Select-Object -Last 3 | ForEach-Object {
        Write-Host "  - $($_.first_name) $($_.last_name)" -ForegroundColor White
        Write-Host "    Position: $($_.position)" -ForegroundColor Gray
        Write-Host "    Company: $($_.company_name)" -ForegroundColor Gray
        Write-Host "    Experience: $($_.experience_years) years" -ForegroundColor Gray
        Write-Host ""
    }
    
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Test Complete ===" -ForegroundColor Cyan
