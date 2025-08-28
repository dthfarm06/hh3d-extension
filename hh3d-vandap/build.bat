@echo off
echo 🎯 Building HH3D Vấn Đáp Helper Extension...
echo.

REM Check if all required files exist
echo ✓ Checking required files...
if not exist "manifest.json" (
    echo ❌ manifest.json not found!
    exit /b 1
)
if not exist "content.js" (
    echo ❌ content.js not found!
    exit /b 1
)
if not exist "popup.html" (
    echo ❌ popup.html not found!
    exit /b 1
)
if not exist "popup.js" (
    echo ❌ popup.js not found!
    exit /b 1
)
if not exist "background.js" (
    echo ❌ background.js not found!
    exit /b 1
)
if not exist "styles.css" (
    echo ❌ styles.css not found!
    exit /b 1
)
echo ✅ All required files found!
echo.

REM Test JavaScript syntax
echo ✓ Testing JavaScript syntax...
node -c content.js
if errorlevel 1 (
    echo ❌ content.js has syntax errors!
    exit /b 1
)
echo ✅ content.js syntax OK

node -c popup.js
if errorlevel 1 (
    echo ❌ popup.js has syntax errors!
    exit /b 1
)
echo ✅ popup.js syntax OK

node -c background.js
if errorlevel 1 (
    echo ❌ background.js has syntax errors!
    exit /b 1
)
echo ✅ background.js syntax OK
echo.

REM Check manifest version
echo ✓ Checking manifest...
findstr /C:"manifest_version.*3" manifest.json >nul
if errorlevel 1 (
    echo ❌ Not a Manifest V3 extension!
    exit /b 1
)
echo ✅ Manifest V3 confirmed
echo.

REM Verify permissions
echo ✓ Checking permissions...
findstr /C:"activeTab" manifest.json >nul || (
    echo ❌ Missing activeTab permission!
    exit /b 1
)
findstr /C:"storage" manifest.json >nul || (
    echo ❌ Missing storage permission!
    exit /b 1
)
echo ✅ Required permissions found
echo.

REM Check icons
echo ✓ Checking icons...
if not exist "images\icon16.png" (
    echo ⚠️  Warning: icon16.png not found
)
if not exist "images\icon48.png" (
    echo ⚠️  Warning: icon48.png not found  
)
if not exist "images\icon128.png" (
    echo ⚠️  Warning: icon128.png not found
)
echo.

echo 🎉 Extension build check completed successfully!
echo.
echo 📋 Installation Instructions:
echo 1. Open Chrome and go to chrome://extensions/
echo 2. Enable "Developer mode" (toggle in top right)
echo 3. Click "Load unpacked"
echo 4. Select this folder: %CD%
echo 5. Extension will be loaded with 🎯 icon
echo.
echo 🧪 Testing:
echo - Open mock\mock-vandap-improved.html for testing
echo - Or visit hoathinh3d.mx/van-dap-tong-mon for production
echo.
echo ✨ Ready to use!
pause
