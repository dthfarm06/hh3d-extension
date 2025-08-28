@echo off
echo =====================================
echo    HH3D Van Dap Helper - Build Script
echo =====================================
echo.

echo Checking extension files...
if not exist manifest.json (
    echo ERROR: manifest.json not found!
    pause
    exit /b 1
)

if not exist content.js (
    echo ERROR: content.js not found!
    pause
    exit /b 1
)

if not exist popup.html (
    echo ERROR: popup.html not found!
    pause
    exit /b 1
)

if not exist popup.js (
    echo ERROR: popup.js not found!
    pause
    exit /b 1
)

if not exist styles.css (
    echo ERROR: styles.css not found!
    pause
    exit /b 1
)

if not exist background.js (
    echo ERROR: background.js not found!
    pause
    exit /b 1
)

echo All required files found!
echo.

echo Opening Chrome Extensions page...
start chrome://extensions/

echo.
echo ===========================================
echo  HH3D Van Dap Helper Ready for Installation
echo ===========================================
echo.
echo INSTRUCTIONS:
echo 1. Turn ON "Developer mode" (top right toggle)
echo 2. Click "Load unpacked" button
echo 3. Select this folder: %cd%
echo 4. Test on: https://hoathinh3d.mx/van-dap-tong-mon
echo 5. Or test locally with mock-vandap.html
echo.
echo Extension files location: %cd%
echo.
pause
