# Script to restart backend and verify routes
Write-Host "=== Restarting Backend Server ===" -ForegroundColor Cyan

# Kill any existing Node processes on port 5000
Write-Host "`n1️⃣ Stopping existing backend processes..." -ForegroundColor Yellow
$processes = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique

if ($processes) {
    foreach ($proc in $processes) {
        try {
            Stop-Process -Id $proc -Force
            Write-Host "   ✅ Stopped process $proc" -ForegroundColor Green
        } catch {
            Write-Host "   ⚠️ Could not stop process $proc" -ForegroundColor Yellow
        }
    }
    Start-Sleep -Seconds 2
} else {
    Write-Host "   ℹ️ No existing processes on port 5000" -ForegroundColor Gray
}

# Start backend
Write-Host "`n2️⃣ Starting backend server..." -ForegroundColor Yellow
Write-Host "   Location: backend/" -ForegroundColor Gray

Set-Location backend

# Start in new window so we can see logs
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm start"

Write-Host "   ✅ Backend starting in new window..." -ForegroundColor Green
Write-Host "   Wait 5 seconds for server to initialize..." -ForegroundColor Gray
Start-Sleep -Seconds 5

# Test if server is running
Write-Host "`n3️⃣ Testing server..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/health" -Method GET -TimeoutSec 5
    Write-Host "   ✅ Server is running!" -ForegroundColor Green
    Write-Host "   Status: $($response.status)" -ForegroundColor Gray
    Write-Host "   Message: $($response.message)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Server not responding" -ForegroundColor Red
    Write-Host "   Check the new PowerShell window for errors" -ForegroundColor Yellow
    Set-Location ..
    exit 1
}

# Test candidate-tests routes
Write-Host "`n4️⃣ Testing candidate-tests routes..." -ForegroundColor Yellow

# Login first
Write-Host "   Logging in..." -ForegroundColor Gray
$loginBody = @{
    username = "havy@test.com"
    password = "123456"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.data.token
    Write-Host "   ✅ Login successful" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Login failed" -ForegroundColor Red
    Set-Location ..
    exit 1
}

# Test routes exist
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

Write-Host "`n   Testing route: POST /api/candidate-tests/1/start" -ForegroundColor Gray
try {
    $startResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/candidate-tests/1/start" -Method POST -Headers $headers -ErrorAction Stop
    if ($startResponse.StatusCode -eq 404) {
        Write-Host "   ❌ Route not found (404)" -ForegroundColor Red
    } else {
        Write-Host "   ✅ Route exists (Status: $($startResponse.StatusCode))" -ForegroundColor Green
    }
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 404) {
        Write-Host "   ❌ Route NOT FOUND (404)" -ForegroundColor Red
        Write-Host "   This means the route is not registered!" -ForegroundColor Red
    } else {
        Write-Host "   ✅ Route exists (Status: $statusCode)" -ForegroundColor Green
    }
}

Write-Host "`n   Testing route: POST /api/candidate-tests/1/answers" -ForegroundColor Gray
$answerBody = @{
    question_id = 1
    selected_option_id = 1
} | ConvertTo-Json

try {
    $answerResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/candidate-tests/1/answers" -Method POST -Headers $headers -Body $answerBody -ErrorAction Stop
    if ($answerResponse.StatusCode -eq 404) {
        Write-Host "   ❌ Route not found (404)" -ForegroundColor Red
    } else {
        Write-Host "   ✅ Route exists (Status: $($answerResponse.StatusCode))" -ForegroundColor Green
    }
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 404) {
        Write-Host "   ❌ Route NOT FOUND (404)" -ForegroundColor Red
        Write-Host "   This means the route is not registered!" -ForegroundColor Red
    } else {
        Write-Host "   ✅ Route exists (Status: $statusCode)" -ForegroundColor Green
    }
}

Write-Host "`n   Testing route: POST /api/candidate-tests/1/complete" -ForegroundColor Gray
try {
    $completeResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/candidate-tests/1/complete" -Method POST -Headers $headers -ErrorAction Stop
    if ($completeResponse.StatusCode -eq 404) {
        Write-Host "   ❌ Route not found (404)" -ForegroundColor Red
    } else {
        Write-Host "   ✅ Route exists (Status: $($completeResponse.StatusCode))" -ForegroundColor Green
    }
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 404) {
        Write-Host "   ❌ Route NOT FOUND (404)" -ForegroundColor Red
        Write-Host "   This means the route is not registered!" -ForegroundColor Red
    } else {
        Write-Host "   ✅ Route exists (Status: $statusCode)" -ForegroundColor Green
    }
}

Set-Location ..

Write-Host "`n=== Backend Restart Complete ===" -ForegroundColor Cyan
Write-Host "`n📝 Next steps:" -ForegroundColor Yellow
Write-Host "   1. Check the new PowerShell window for server logs" -ForegroundColor Gray
Write-Host "   2. Try the test again in the browser" -ForegroundColor Gray
Write-Host "   3. Watch the server console for any errors" -ForegroundColor Gray
Write-Host "`n🌐 Frontend: http://localhost:3000/exam.html" -ForegroundColor Cyan
Write-Host "🔐 Login: havy@test.com / 123456" -ForegroundColor Cyan
