# Test script to verify candidate list API fix
Write-Host "=== Testing Candidate List API Fix ===" -ForegroundColor Cyan

# First, let's check if backend is running
Write-Host "`n1. Checking if backend is running..." -ForegroundColor Yellow
$backendRunning = $false
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api" -Method GET -TimeoutSec 2 -ErrorAction SilentlyContinue
    $backendRunning = $true
    Write-Host "   ✅ Backend is running" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Backend is not running" -ForegroundColor Red
    Write-Host "   Please start backend first: cd backend && npm start" -ForegroundColor Yellow
    exit 1
}

# Login to get token
Write-Host "`n2. Getting authentication token..." -ForegroundColor Yellow
$loginBody = @{
    username = "recruiter_test"
    password = "Test123456"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.data.token
    Write-Host "   ✅ Successfully logged in as recruiter_test" -ForegroundColor Green
    Write-Host "   Token: $($token.Substring(0, 20))..." -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test candidates API
Write-Host "`n3. Testing /api/candidates endpoint..." -ForegroundColor Yellow
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

try {
    $candidatesResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/candidates?page=1&limit=5" -Method GET -Headers $headers
    
    Write-Host "   ✅ API call successful" -ForegroundColor Green
    Write-Host "`n   Response structure:" -ForegroundColor Cyan
    Write-Host "   - success: $($candidatesResponse.success)" -ForegroundColor Gray
    Write-Host "   - message: $($candidatesResponse.message)" -ForegroundColor Gray
    Write-Host "   - data type: $($candidatesResponse.data.GetType().Name)" -ForegroundColor Gray
    
    if ($candidatesResponse.data -is [Array]) {
        Write-Host "   - data is Array: ✅" -ForegroundColor Green
        Write-Host "   - candidates count: $($candidatesResponse.data.Count)" -ForegroundColor Gray
        
        if ($candidatesResponse.data.Count -gt 0) {
            Write-Host "`n   First candidate sample:" -ForegroundColor Cyan
            $firstCandidate = $candidatesResponse.data[0]
            Write-Host "   - candidate_id: $($firstCandidate.candidate_id)" -ForegroundColor Gray
            Write-Host "   - email: $($firstCandidate.email)" -ForegroundColor Gray
            Write-Host "   - status: $($firstCandidate.status)" -ForegroundColor Gray
        }
    } else {
        Write-Host "   - data is Array: ❌ (Type: $($candidatesResponse.data.GetType().Name))" -ForegroundColor Red
        Write-Host "   This would cause 'not iterable' error!" -ForegroundColor Red
    }
    
    if ($candidatesResponse.pagination) {
        Write-Host "`n   Pagination info:" -ForegroundColor Cyan
        Write-Host "   - total: $($candidatesResponse.pagination.total)" -ForegroundColor Gray
        Write-Host "   - page: $($candidatesResponse.pagination.page)" -ForegroundColor Gray
        Write-Host "   - limit: $($candidatesResponse.pagination.limit)" -ForegroundColor Gray
    }
    
} catch {
    Write-Host "   ❌ API call failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Response: $($_.Exception.Response)" -ForegroundColor Gray
    exit 1
}

Write-Host "`n=== Test Complete ===" -ForegroundColor Cyan
Write-Host "✅ The fix should resolve the 'allCandidates is not iterable' error" -ForegroundColor Green
Write-Host "`nYou can now test in browser at: http://localhost:3000/candidate-list.html" -ForegroundColor Yellow
