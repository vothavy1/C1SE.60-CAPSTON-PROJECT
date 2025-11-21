# Quick Test Email System - PASS scenario
Write-Host "🎉 Quick Test: PASS Email (Auto create account)" -ForegroundColor Green
Write-Host ""

$token = Read-Host "Enter your token"
$candidateId = Read-Host "Enter candidate ID"

$body = @{
    status = "HIRED"
    notes = "Test PASS - Auto create account and send email"
} | ConvertTo-Json

Write-Host ""
Write-Host "📤 Updating candidate status to HIRED..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/candidates/$candidateId/status" `
        -Method PUT `
        -Headers @{ 
            "Authorization" = "Bearer $token"
            "Content-Type" = "application/json" 
        } `
        -Body $body
    
    Write-Host "✅ SUCCESS!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Result:" -ForegroundColor Cyan
    $response.data | Format-List
    
    Write-Host ""
    Write-Host "📧 Check email: $($response.data.email)" -ForegroundColor Yellow
    
} catch {
    Write-Host "❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host $_.ErrorDetails.Message -ForegroundColor Red
    }
}
