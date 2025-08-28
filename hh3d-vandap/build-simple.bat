@echo off
echo Building HH3D Extension...
echo.

echo Checking files...
if exist "manifest.json" echo ✓ manifest.json
if exist "content.js" echo ✓ content.js  
if exist "popup.html" echo ✓ popup.html
if exist "popup.js" echo ✓ popup.js
if exist "background.js" echo ✓ background.js
if exist "styles.css" echo ✓ styles.css

echo.
echo Testing JavaScript...
node -c content.js && echo ✓ content.js OK
node -c popup.js && echo ✓ popup.js OK  
node -c background.js && echo ✓ background.js OK

echo.
echo Build completed successfully!
echo.
echo Installation:
echo 1. Open chrome://extensions/
echo 2. Enable Developer mode
echo 3. Click Load unpacked
echo 4. Select this folder
echo.
pause
