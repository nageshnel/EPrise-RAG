@echo off
echo ===================================================
echo   AIRAG POC - Stopping All Java Microservices
echo ===================================================
echo.
echo Stopping all running Java processes and Maven daemons...
taskkill /f /im java.exe
taskkill /f /im mvnd.exe
echo.
echo Clean up complete! All services stopped.
echo ===================================================
pause
