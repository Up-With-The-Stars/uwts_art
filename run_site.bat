@echo off
cd /d "%~dp0"

echo Generating GFX Search...
py -3 gfx-search\generator.py

if errorlevel 1 (
    echo Generation failed!
    pause
    exit /b 1
)

echo.
echo Starting local website...
echo Open http://localhost:8000
echo Press Ctrl+C to stop.
echo.

py -3 -m http.server 8000 --directory _site

pause
