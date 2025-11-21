Write-Host "`n=== FULL TEST SUBMISSION FLOW ===" -ForegroundColor Cyan

# Login
Write-Host "`n1. Login as havy..." -ForegroundColor Yellow
$loginResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body '{"username":"havy","password":"123456"}' `
    -UseBasicParsing

$loginData = $loginResponse.Content | ConvertFrom-Json
$token = $loginData.data.token
Write-Host "✅ Token: $($token.Substring(0,20))..." -ForegroundColor Green

# Start a test
Write-Host "`n2. Starting test 26..." -ForegroundColor Yellow
$startResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/candidate-tests" `
    -Method POST `
    -Headers @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    } `
    -Body '{"test_id": 26}' `
    -UseBasicParsing

$startData = $startResponse.Content | ConvertFrom-Json
$candidateTestId = $startData.data.candidate_test_id
Write-Host "✅ Candidate Test ID: $candidateTestId" -ForegroundColor Green

# Start the test (change status to IN_PROGRESS)
Write-Host "`n3. Starting test execution..." -ForegroundColor Yellow
$execStartResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/candidate-tests/$candidateTestId/start" `
    -Method POST `
    -Headers @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    } `
    -UseBasicParsing

Write-Host "✅ Test started" -ForegroundColor Green

# Get questions
Write-Host "`n4. Getting questions..." -ForegroundColor Yellow
$questionsResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/tests/26/questions" `
    -Headers @{
        "Authorization" = "Bearer $token"
    } `
    -UseBasicParsing

$questionsData = $questionsResponse.Content | ConvertFrom-Json
$questions = $questionsData.data.questions
Write-Host "✅ Found $($questions.Length) questions" -ForegroundColor Green

# Submit answers for first 3 questions
Write-Host "`n5. Submitting answers..." -ForegroundColor Yellow
for ($i = 0; $i -lt [Math]::Min(3, $questions.Length); $i++) {
    $q = $questions[$i]
    $questionId = $q.question_id
    
    # Get first option
    $firstOption = $q.QuestionOptions[0].option_id
    
    $answerBody = @{
        question_id = $questionId
        selected_option_id = $firstOption.ToString()
    } | ConvertTo-Json
    
    Write-Host "  Submitting answer for question $questionId (option: $firstOption)..." -NoNewline
    
    $answerResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/candidate-tests/$candidateTestId/answers" `
        -Method POST `
        -Headers @{
            "Authorization" = "Bearer $token"
            "Content-Type" = "application/json"
        } `
        -Body $answerBody `
        -UseBasicParsing
    
    Write-Host " ✅" -ForegroundColor Green
}

# Complete the test
Write-Host "`n6. Completing test..." -ForegroundColor Yellow
$completeResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/candidate-tests/$candidateTestId/complete" `
    -Method POST `
    -Headers @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    } `
    -UseBasicParsing

$completeData = $completeResponse.Content | ConvertFrom-Json
Write-Host "✅ Test completed!" -ForegroundColor Green

# Display result
Write-Host "`n=== RESULT ===" -ForegroundColor Cyan
Write-Host "Success: $($completeData.success)" -ForegroundColor $(if($completeData.success){"Green"}else{"Red"})
Write-Host "Message: $($completeData.message)" -ForegroundColor White

if ($completeData.data) {
    Write-Host "`nResult Data:" -ForegroundColor Yellow
    Write-Host "  candidate_test_id: $($completeData.data.candidate_test_id)" -ForegroundColor White
    Write-Host "  status: $($completeData.data.status)" -ForegroundColor White
    Write-Host "  is_result_visible: $($completeData.data.is_result_visible)" -ForegroundColor White
    
    if ($completeData.data.is_result_visible) {
        Write-Host "  score: $($completeData.data.score)" -ForegroundColor Green
        Write-Host "  percentage: $($completeData.data.percentage)%" -ForegroundColor Green
        Write-Host "  passed: $($completeData.data.passed)" -ForegroundColor $(if($completeData.data.passed){"Green"}else{"Red"})
    } else {
        Write-Host "  ⏳ Results are hidden (waiting for review)" -ForegroundColor Yellow
    }
}

Write-Host "`n=== COMPLETE ===" -ForegroundColor Cyan
