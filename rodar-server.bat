@echo off
cd /d "%~dp0"
echo ============================================
echo  CAUTELA & VISTORIA - Servidor Next.js
echo  (Turbopack, em http://localhost:3000)
echo ============================================
echo.
call npm run dev
pause
