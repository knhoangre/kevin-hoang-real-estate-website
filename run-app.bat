@echo off
echo Starting Docker Desktop...
echo Please make sure Docker Desktop is installed and running
echo.
echo If Docker Desktop is not running, please start it manually
echo.
echo Press any key to continue after Docker Desktop is running...
pause

echo.
echo Building and starting the application...
docker-compose up --build

echo.
echo Application should be available at: http://localhost:5173
echo.
echo Press any key to exit...
pause
