@echo off
cd /d "%~dp0"

echo ========================================================
echo       Browser Resource Manager - Setup Tool
echo ========================================================
echo.

REM 1. Check and Restore Icon
if not exist "app.ico" (
    echo [Check] Icon missing, regenerating...
    powershell -ExecutionPolicy Bypass -File convert_icon.ps1
    if exist "app.ico" (
        echo [OK] Icon generated.
    ) else (
        echo [Error] Icon generation failed. Using default icon.
    )
) else (
    echo [Check] Icon found.
)

REM 2. Generate Shortcut
echo.
echo [Action] Creating Desktop Shortcut...
cscript //nologo fix_shortcut.vbs

if %errorlevel% equ 0 (
    echo [Success] Shortcut created successfully!
    echo You can move this folder anywhere.
    echo Run this script again to restore the shortcut if needed.
) else (
    echo [Failed] Failed to create shortcut. Please run as Administrator.
)

echo.
echo ========================================================
echo Press any key to exit...
pause >nul
