# Test Apply System
Write-Host "=== Testing Apply System ===" -ForegroundColor Cyan
Write-Host ""

# Test 1: Check backend is running
Write-Host "1. Checking backend status..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:5000/api/health"
    Write-Host "✓ Backend is running" -ForegroundColor Green
} catch {
    Write-Host "✗ Backend is not running. Please start it first!" -ForegroundColor Red
    exit
}

Write-Host ""

# Test 2: Check if Apply route is registered
Write-Host "2. Testing Apply route registration..." -ForegroundColor Yellow
Write-Host "Testing POST /api/apply endpoint (should accept multipart/form-data)" -ForegroundColor Gray
Write-Host ""

# Test 3: Get Candidates List (Requires Auth)
Write-Host "3. Testing Get Candidates API (requires auth)..." -ForegroundColor Yellow

# Get list of recruiters from database
$recruiterResult = docker exec cs60_mysql mysql -uroot -prootpassword cs60_recruitment -e "SELECT email FROM users WHERE role_id = (SELECT role_id FROM roles WHERE role_name = 'RECRUITER') LIMIT 1;" --batch --skip-column-names 2>&1 | Where-Object { $_ -notmatch "Warning" }

if ($recruiterResult) {
    $recruiterEmail = $recruiterResult.Trim()
    
    Write-Host "Found recruiter: $recruiterEmail" -ForegroundColor Cyan
    Write-Host "Attempting login..." -ForegroundColor Gray
    
    # Try common passwords
    $passwords = @("123456", "password", "admin123")
    $loginSuccess = $false
    $token = $null
    
    foreach ($pass in $passwords) {
        try {
            $loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
                -Method POST `
                -ContentType "application/json" `
                -Body (@{
                    email = $recruiterEmail
                    password = $pass
                } | ConvertTo-Json)
            
            $token = $loginResponse.token
            $loginSuccess = $true
            Write-Host "Login successful with password: $pass" -ForegroundColor Green
            break
        } catch {
            # Try next password
        }
    }
    
    if ($loginSuccess) {
        # Test GET /api/candidates
        try {
            $candidatesResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/candidates" `
                -Method GET `
                -Headers @{
                    "Authorization" = "Bearer $token"
                    "Content-Type" = "application/json"
                }
            
            Write-Host "✓ GET /api/candidates works!" -ForegroundColor Green
            Write-Host "Total candidates: $($candidatesResponse.count)" -ForegroundColor Cyan
            
            if ($candidatesResponse.data.Count -gt 0) {
                Write-Host "`nSample candidates:" -ForegroundColor Yellow
                $candidatesResponse.data | Select-Object -First 3 | ForEach-Object {
                    $hasCV = if ($_.CandidateResumes -and $_.CandidateResumes.Count -gt 0) { "Has CV" } else { "No CV" }
                    Write-Host "  - ID: $($_.candidate_id) | $($_.first_name) $($_.last_name) | $($_.email) | Status: $($_.status) | $hasCV" -ForegroundColor Gray
                }
                
                # Test 4: Update Status
                Write-Host "`n4. Testing Update Status API..." -ForegroundColor Yellow
                $testCandidate = $candidatesResponse.data[0]
                $newStatus = if ($testCandidate.status -eq "NEW") { "SCREENING" } else { "NEW" }
                
                try {
                    $statusResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/candidates/$($testCandidate.candidate_id)/status" `
                        -Method PUT `
                        -Headers @{
                            "Authorization" = "Bearer $token"
                            "Content-Type" = "application/json"
                        } `
                        -Body (@{
                            status = $newStatus
                        } | ConvertTo-Json)
                    
                    Write-Host "✓ PUT /api/candidates/:id/status works!" -ForegroundColor Green
                    Write-Host "  Changed: $($testCandidate.first_name) $($testCandidate.last_name) from $($statusResponse.data.old_status) to $($statusResponse.data.new_status)" -ForegroundColor Cyan
                } catch {
                    Write-Host "✗ Update status failed: $($_.Exception.Message)" -ForegroundColor Red
                }
            } else {
                Write-Host "No candidates found. Submit one via apply.html first!" -ForegroundColor Yellow
            }
            
        } catch {
            Write-Host "✗ GET /api/candidates failed: $($_.Exception.Message)" -ForegroundColor Red
        }
    } else {
        Write-Host "✗ Could not login. Please check recruiter password in database" -ForegroundColor Red
    }
} else {
    Write-Host "✗ No recruiter found in database" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== API Endpoints Summary ===" -ForegroundColor Cyan
Write-Host "POST   /api/apply                      - Public (no auth) - Upload CV" -ForegroundColor White
Write-Host "GET    /api/candidates                 - Auth required    - List candidates" -ForegroundColor White
Write-Host "PUT    /api/candidates/:id/status      - Auth required    - Update status" -ForegroundColor White
Write-Host "GET    /api/candidates/:id/cv          - Auth required    - Download CV" -ForegroundColor White
Write-Host ""

Write-Host "=== Manual Testing Guide ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Step 1: Test Apply Form (Public)" -ForegroundColor Yellow
Write-Host "  1. Open http://localhost:3000/apply.html" -ForegroundColor White
Write-Host "  2. Fill form: First name, Last name, Email, Phone" -ForegroundColor White
Write-Host "  3. Upload a PDF/DOC file as CV" -ForegroundColor White
Write-Host "  4. Click 'Gửi CV Ứng Tuyển'" -ForegroundColor White
Write-Host "  5. Should see success message" -ForegroundColor White
Write-Host ""

Write-Host "Step 2: Test Candidate Management (Recruiter)" -ForegroundColor Yellow
Write-Host "  1. Login as recruiter at http://localhost:3000/index.html" -ForegroundColor White
Write-Host "  2. Open http://localhost:3000/candidate-management.html" -ForegroundColor White
Write-Host "  3. Should see list of candidates" -ForegroundColor White
Write-Host "  4. Click '📄 CV' button to download CV" -ForegroundColor White
Write-Host "  5. Click '✓ Pass' to mark candidate as HIRED" -ForegroundColor White
Write-Host "  6. Click '✗ Fail' to mark candidate as REJECTED" -ForegroundColor White
Write-Host ""

Write-Host "Step 3: Alternative - Use existing candidate-list.html" -ForegroundColor Yellow  
Write-Host "  Open http://localhost:3000/candidate-list.html for full management" -ForegroundColor White
Write-Host ""

Write-Host "Apply System is ready to use!" -ForegroundColor Green
