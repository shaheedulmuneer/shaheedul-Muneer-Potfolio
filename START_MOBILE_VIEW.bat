@echo off
title Shaheed Portfolio - Mobile Server
cd /d "%~dp0"

echo ==========================================================
echo       STARTING SHAHEED PORTFOLIO MOBILE PREVIEW
echo ==========================================================
echo.

taskkill /f /im MobileServer.exe >nul 2>&1
taskkill /f /im cloudflared.exe >nul 2>&1

start "" "%~dp0server_bin\MobileServer.exe" "%~dp0" 8080

timeout /t 2 /nobreak >nul

echo Starting Cloudflare Tunnel for mobile access...
start "" "%~dp0server_bin\cloudflared.exe" tunnel --url http://localhost:8080

timeout /t 3 /nobreak >nul

start "" "%~dp0mobile_qr.html"

echo.
echo ==========================================================
echo The server is running!
echo Scan the QR code in the browser window to open on your phone.
echo ==========================================================
pause
