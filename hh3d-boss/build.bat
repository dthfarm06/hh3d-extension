@echo off
echo ============================================
echo   Boss Helper Chrome Extension Builder
echo ============================================
echo.

echo [1/3] Checking files...
if not exist "manifest.json" (
    echo ERROR: manifest.json not found!
    pause
    exit /b 1
)

if not exist "content.js" (
    echo ERROR: content.js not found!
    pause
    exit /b 1
)

if not exist "background.js" (
    echo ERROR: background.js not found!
    pause
    exit /b 1
)

if not exist "popup.html" (
    echo ERROR: popup.html not found!
    pause
    exit /b 1
)

echo ✓ All required files found

echo.
echo [2/3] Creating extension package...

REM Create a simple zip if 7zip is available
where 7z >nul 2>nul
if %ERRORLEVEL% == 0 (
    echo Using 7zip to create package...
    7z a -tzip boss-helper-extension.zip manifest.json *.js *.html *.css icons/ sounds/ README.md
    echo ✓ Package created: boss-helper-extension.zip
) else (
    echo 7zip not found. Please manually zip the following files:
    echo - manifest.json
    echo - content.js
    echo - background.js  
    echo - popup.html
    echo - popup.css
    echo - popup.js
    echo - icons/ folder
    echo - sounds/ folder
    echo - README.md
)

echo.
echo [3/3] Installation instructions:
echo.
echo 1. Open Chrome and go to chrome://extensions/
echo 2. Enable "Developer mode" (top right toggle)
echo 3. Click "Load unpacked" 
echo 4. Select this folder: %CD%
echo 5. Extension will be loaded and ready to use!
echo.
echo For production: Package as .crx or upload to Chrome Web Store
echo.

echo ============================================
echo Build complete! Ready for installation.
echo ============================================
pause
