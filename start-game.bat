@echo off
echo Starting 3D Ball Adventure...

:: Check if Python is installed (we'll use it for a simple HTTP server)
python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo Starting local web server...
    start "" http://localhost:8000
    start /min cmd /c "python -m http.server 8000"
) else (
    python3 --version >nul 2>&1
    if %errorlevel% equ 0 (
        echo Starting local web server...
        start "" http://localhost:8000
        start /min cmd /c "python3 -m http.server 8000"
    ) else (
        echo Python not found. Opening the game directly...
        start "" "%~dp0index.html"
        echo NOTE: Some browsers may restrict loading resources when opening files directly.
        echo If the game doesn't work properly, try installing Python or use a local web server.
    )
)

echo Game launched! You can close this window.