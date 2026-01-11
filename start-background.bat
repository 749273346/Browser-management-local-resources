@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo    Local Resource Manager - Server Launcher
echo ===================================================

:: 1. Check for Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed on this computer.
    echo.
    echo Node.js is required to run the local server.
    echo.
    set /p "CHOICE=Do you want to install Node.js automatically? (Y/N): "
    
    if /i "!CHOICE!"=="Y" (
        goto :InstallNode
    ) else (
        echo.
        echo Please install Node.js manually from: https://nodejs.org/
        echo After installation, run this script again.
        pause
        exit /b
    )
)

:CheckDependencies
:: 2. Check and Install Dependencies
if not exist "%~dp0server\node_modules" (
    echo [INFO] First run detected. Installing server dependencies...
    cd /d "%~dp0server"
    call npm install
    if !errorlevel! neq 0 (
        echo [ERROR] Failed to install dependencies.
        pause
        exit /b
    )
    cd /d "%~dp0"
    echo [INFO] Dependencies installed successfully.
)

:: 3. Start Server
echo [INFO] Starting server in background...
cscript //nologo "%~dp0start-server-hidden.vbs"

echo.
echo [SUCCESS] Server is running!
echo ===================================================
echo.
echo Now you can use the Chrome Extension:
echo 1. Open Chrome
echo 2. Go to Extensions (chrome://extensions)
echo 3. Ensure 'Developer mode' is ON
echo 4. Click 'Load unpacked'
echo 5. Select this folder:
echo    %~dp0extension\dist
echo.
echo Note: The server will keep running even if you close this window.
echo To stop it, use Task Manager to end 'Node.js' process.
echo.
pause
exit /b

:InstallNode
echo.

:: Check for local installer first
set "localInstaller=%~dp0resources\node-v18-x64.msi"
if exist "!localInstaller!" (
    echo [INFO] Found local offline installer.
    set "nodeFile=!localInstaller!"
    goto :RunInstaller
)

echo [INFO] Local installer not found. Attempting download...
echo [INFO] Detecting system architecture...
if "%PROCESSOR_ARCHITECTURE%"=="AMD64" (
    set "nodeUrl=https://nodejs.org/dist/v18.17.1/node-v18.17.1-x64.msi"
    set "nodeFile=node-install.msi"
    echo [INFO] 64-bit system detected.
) else (
    set "nodeUrl=https://nodejs.org/dist/v18.17.1/node-v18.17.1-x86.msi"
    set "nodeFile=node-install.msi"
    echo [INFO] 32-bit system detected.
)

echo [INFO] Downloading Node.js (approx 30MB)...
echo This may take a minute depending on your internet connection.
powershell -Command "try { Invoke-WebRequest -Uri '%nodeUrl%' -OutFile '%nodeFile%' -ErrorAction Stop } catch { exit 1 }"

if %errorlevel% neq 0 (
    echo [ERROR] Download failed. Please check your internet connection.
    echo You can download manually at: %nodeUrl%
    del "%nodeFile%" >nul 2>&1
    pause
    exit /b
)

:RunInstaller
echo [INFO] Installing Node.js...
echo Please follow the installation prompts (click Next/Install).
echo IMPORTANT: When finished, you may need to RESTART this script.
msiexec /i "%nodeFile%" /qb

echo.
if not "%nodeFile%"=="!localInstaller!" (
    echo [INFO] Cleaning up downloaded installer...
    del "%nodeFile%" >nul 2>&1
)

echo.
echo [CHECK] Verifying installation...
:: Refresh environment variables for the current session
call RefreshEnv.cmd >nul 2>&1
:: Basic check
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [WARN] Node.js command not found yet.
    echo Please CLOSE this window and run start-background.bat again to reload settings.
    pause
    exit /b
) else (
    echo [SUCCESS] Node.js installed successfully!
    goto :CheckDependencies
)
