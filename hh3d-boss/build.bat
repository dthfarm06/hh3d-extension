@echo off
echo ============================================
echo   Boss Helper Chrome Extension Builder
echo   Version: Auto URL Detection
echo ============================================
echo.

echo [1/4] Checking files...
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

echo [2/4] Validating JSON syntax...
node -e "try { JSON.parse(require('fs').readFileSync('manifest.json', 'utf8')); console.log('✅ Manifest JSON valid'); } catch(e) { console.error('❌ Manifest JSON error:', e.message); process.exit(1); }"
if %ERRORLEVEL% neq 0 (
    echo ERROR: manifest.json has syntax errors!
    pause
    exit /b 1
)

echo [3/4] Checking JavaScript syntax...
node -c content.js
if %ERRORLEVEL% neq 0 (
    echo ERROR: content.js has syntax errors!
    pause
    exit /b 1
)

node -c background.js
if %ERRORLEVEL% neq 0 (
    echo ERROR: background.js has syntax errors!
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
echo [4/4] Creating extension package...

REM Create a simple zip if 7zip is available
where 7z >nul 2>nul
if %ERRORLEVEL% == 0 (
    echo Using 7zip to create package...
    7z a -tzip boss-helper-auto-url-extension.zip manifest.json *.js *.html *.css icons/ sounds/ README.md test-url-detection.html test-countdown-parsing.html test-countdown.js
    echo ✓ Package created: boss-helper-auto-url-extension.zip
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
    echo - test-url-detection.html
    echo - test-countdown-parsing.html
    echo - test-countdown.js
)

echo.
echo 🔧 TESTING INSTRUCTIONS:
echo.
echo 1. Open Chrome and go to chrome://extensions/
echo 2. Enable "Developer mode" (top right toggle)
echo 3. Click "Load unpacked" 
echo 4. Select this folder: %CD%
echo 5. Extension will be loaded and ready to use!
echo.
echo 🎯 AUTO URL DETECTION TEST:
echo.
echo 1. Navigate to: https://hoathinh3d.mx/hoang-vuc?t=123
echo 2. Check Chrome DevTools Console for logs
echo 3. Extension should auto-activate and show notification
echo.
echo 📋 DEBUG TEST PAGE:
echo.
echo 1. Open: test-url-detection.html in Chrome
echo 2. Use test buttons to verify URL detection
echo 3. Check console for detailed logs
echo.
echo 🕒 COUNTDOWN PARSING TEST:
echo.
echo 1. Open: test-countdown-parsing.html in Chrome  
echo 2. Test Vietnamese countdown format parsing
echo 3. Run: node test-countdown.js for command line test
echo.
echo For production: Package as .crx or upload to Chrome Web Store
echo.

echo ============================================
echo ✅ Build complete! Ready for testing.
echo 📝 Check console logs for debugging info.
echo ============================================
pause
