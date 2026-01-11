@echo off
echo Creating scheduled task for Local Resource Manager Server...
echo This will make the server start automatically with Windows...

set "taskName=LocalResourceManagerServer"
set "scriptPath=%~dp0start-background.bat"

schtasks /create /tn "%taskName%" /tr "\"%scriptPath%\"" /sc onlogon /ru "%USERNAME%" /rl highest /f >nul 2>&1
if %errorlevel% neq 0 (
    schtasks /create /tn "%taskName%" /tr "\"%scriptPath%\"" /sc onlogon /f >nul 2>&1
)

if %errorlevel% equ 0 (
    echo Scheduled task created successfully.
    echo The server will now start automatically when you log in to Windows.
    echo.
    echo To remove this task later, run: schtasks /delete /tn "%taskName%" /f
    schtasks /run /tn "%taskName%" >nul 2>&1
    exit /b 0
) else (
    echo Scheduled task creation failed. Trying Startup folder instead...
)

set "startupDir=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "shortcutPath=%startupDir%\LocalResourceManagerServer.lnk"

powershell -NoProfile -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%shortcutPath%'); $s.TargetPath = '%scriptPath%'; $s.WorkingDirectory = '%~dp0'; $s.WindowStyle = 7; $s.Save();" >nul 2>&1

if exist "%shortcutPath%" (
    echo Startup shortcut created successfully.
    echo The server will start automatically next login.
    call "%scriptPath%" >nul 2>&1
    exit /b 0
)

echo Failed to enable auto-start.
echo Run this script as Administrator, or add start-background.bat to Startup manually:
echo %startupDir%
exit /b 1
