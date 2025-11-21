# Test Candidate API
# Kiểm tra xem user có candidate profile không

$API_BASE = "http://localhost:5000/api"

Write-Host "=== Testing Candidate API ===" -ForegroundColor Cyan

# 1. Test login để lấy token
Write-Host "`n1. Testing login..." -ForegroundColor Yellow
$loginBody = @{
    email = "candidate@example.com"  # Thay bằng email thật
    password = "password123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$API_BASE/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.data.token
    $userId = $loginResponse.data.user.userId
    
    Write-Host "✅ Login successful" -ForegroundColor Green
    Write-Host "   User ID: $userId" -ForegroundColor Gray
    Write-Host "   Token: $($token.Substring(0,20))..." -ForegroundColor Gray
    
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    # 2. Check candidate profile
    Write-Host "`n2. Checking candidate profile..." -ForegroundColor Yellow
    try {
        $candidateResponse = Invoke-RestMethod -Uri "$API_BASE/candidates/by-user/$userId" -Method GET -Headers $headers
        Write-Host "✅ Candidate profile found" -ForegroundColor Green
        Write-Host "   Candidate ID: $($candidateResponse.data.candidate_id)" -ForegroundColor Gray
        Write-Host "   Name: $($candidateResponse.data.first_name) $($candidateResponse.data.last_name)" -ForegroundColor Gray
        Write-Host "   Email: $($candidateResponse.data.email)" -ForegroundColor Gray
        Write-Host "   Status: $($candidateResponse.data.status)" -ForegroundColor Gray
    } catch {
        if ($_.Exception.Response.StatusCode.value__ -eq 404) {
            Write-Host "❌ No candidate profile found (404)" -ForegroundColor Red
            Write-Host "   Attempting to create candidate profile..." -ForegroundColor Yellow
            
            # 3. Create candidate profile
            $createBody = @{
                user_id = $userId
                first_name = "Test User"
                last_name = ""
                email = "candidate@example.com"
                status = "ACTIVE"
            } | ConvertTo-Json
            
            try {
                $createResponse = Invoke-RestMethod -Uri "$API_BASE/candidates/self-register" -Method POST -Body $createBody -Headers $headers
                Write-Host "✅ Candidate profile created" -ForegroundColor Green
                Write-Host "   Candidate ID: $($createResponse.data.candidate_id)" -ForegroundColor Gray
            } catch {
                Write-Host "❌ Failed to create candidate profile" -ForegroundColor Red
                Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
                
                $errorDetail = $_.ErrorDetails.Message | ConvertFrom-Json
                Write-Host "   Details: $($errorDetail.message)" -ForegroundColor Red
            }
        } else {
            Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    
} catch {
    Write-Host "❌ Login failed" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "`n💡 Tip: Check if:" -ForegroundColor Yellow
    Write-Host "   1. Backend is running (port 5000)" -ForegroundColor Gray
    Write-Host "   2. Email/password is correct" -ForegroundColor Gray
    Write-Host "   3. User exists in database" -ForegroundColor Gray
    exit 1
}

Write-Host "`n=== Test Complete ===" -ForegroundColor Cyan
