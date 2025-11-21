# Run migration to add companies table
Write-Host "Running migration to add companies table..." -ForegroundColor Cyan

$sqlFile = "d:\CAPSTON C1SE.60\CS.60\database\migrations\add-companies-table.sql"

# Read SQL file and execute in Docker
Get-Content $sqlFile | docker exec -i cs60_mysql mysql -ucs60user -pcs60password cs60_recruitment

if ($LASTEXITCODE -eq 0) {
    Write-Host "Migration completed successfully!" -ForegroundColor Green
} else {
    Write-Host "Migration failed with error code: $LASTEXITCODE" -ForegroundColor Red
}
