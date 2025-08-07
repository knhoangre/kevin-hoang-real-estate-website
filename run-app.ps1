Write-Host "Starting Docker Desktop..." -ForegroundColor Green
Write-Host "Please make sure Docker Desktop is installed and running" -ForegroundColor Yellow
Write-Host ""
Write-Host "If Docker Desktop is not running, please start it manually" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press any key to continue after Docker Desktop is running..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Write-Host ""
Write-Host "Building and starting the application..." -ForegroundColor Green
docker-compose up --build

Write-Host ""
Write-Host "Application should be available at: http://localhost:5173" -ForegroundColor Green
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
