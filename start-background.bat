@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo    Local Resource Manager - Auto Setup
echo ===================================================

:: 1. Check for Node.js
echo [CHECK] Checking system environment...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [INFO] Node.js environment not found.
    echo [INFO] Starting automatic installation...
    goto :InstallNode
) else (
    echo [INFO] Node.js is ready.
)

:CheckDependencies
:: 2. Check and Install Dependencies
if not exist "%~dp0server\node_modules" (
    echo [INFO] Installing server dependencies (First run only)...
    cd /d "%~dp0server"
    call npm install
    if !errorlevel! neq 0 (
        echo [ERROR] Failed to install dependencies.
        pause
        exit /b
    )
    cd /d "%~dp0"
    echo [INFO] Dependencies ready.
)

:: 3. Setup Auto-Start (Startup Folder Shortcut)
echo [INFO] Configuring auto-start on boot...
set "SHORTCUT_PATH=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\LocalResourceManager.lnk"
set "TARGET_PATH=%~dp0start-server-hidden.vbs"
set "WORK_DIR=%~dp0"

:: Use PowerShell to create the shortcut
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%SHORTCUT_PATH%'); $s.TargetPath = '%TARGET_PATH%'; $s.WorkingDirectory = '%WORK_DIR%'; $s.Description = 'Local Resource Manager Background Service'; $s.Save()"

if exist "%SHORTCUT_PATH%" (
    echo [SUCCESS] Auto-start configured successfully.
) else (
    echo [WARN] Could not create auto-start shortcut. You may need to run this script manually after reboot.
)

:: 4. Start Server Now
echo [INFO] Starting background service...
cscript //nologo "%~dp0start-server-hidden.vbs"

echo.
echo ===================================================
echo    All Systems Go!
echo ===================================================
echo.
echo 1. The service is running in the background.
echo 2. It will start automatically when you restart the computer.
echo 3. You can close this window now.
echo.
echo [Action Required] Load the extension in your browser:
echo    path: %~dp0extension
echo.
pause
exit /b

:InstallNode
echo.
:: Check for local installer first (Offline Mode)
set "localInstaller=%~dp0resources\node-v18-x64.msi"
if exist "!localInstaller!" (
    echo [INFO] Found offline installer. Installing...
    set "nodeFile=!localInstaller!"
    goto :RunInstaller
)

:: Online Mode
echo [INFO] Offline installer not found. Checking network...
echo [INFO] Detecting system architecture...
if "%PROCESSOR_ARCHITECTURE%"=="AMD64" (
    set "nodeUrl=https://nodejs.org/dist/v18.17.1/node-v18.17.1-x64.msi"
    set "nodeFile=node-install.msi"
) else (
    set "nodeUrl=https://nodejs.org/dist/v18.17.1/node-v18.17.1-x86.msi"
    set "nodeFile=node-install.msi"
)

echo [INFO] Downloading Node.js...
powershell -Command "try { Invoke-WebRequest -Uri '%nodeUrl%' -OutFile '%nodeFile%' -ErrorAction Stop } catch { exit 1 }"

if %errorlevel% neq 0 (
    echo [ERROR] Download failed. No internet and no offline installer.
    echo Please put 'node-v18-x64.msi' in 'resources' folder or connect to internet.
    pause
    exit /b
)

:RunInstaller
echo [INFO] Installing Node.js (Please wait)...
:: /qb means basic UI (progress bar), /norestart suppresses reboot prompt
msiexec /i "%nodeFile%" /qb /norestart

echo.
if not "%nodeFile%"=="!localInstaller!" (
    del "%nodeFile%" >nul 2>&1
)

echo [INFO] Verifying installation...
:: Attempt to refresh environment by restarting the script if Node is still not found
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [INFO] Environment update pending. Restarting setup script...
    timeout /t 2 >nul
    start "" "%~f0"
    exit /b
) else (
    echo [SUCCESS] Node.js installed. Proceeding...
    goto :CheckDependencies
)
