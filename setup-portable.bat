@echo off
echo ========================================
echo Local Resource Manager - Portable Setup
echo ========================================
echo.

:: 检查Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Node.js not found. Installing...
    
    :: 检测系统架构
    if "%PROCESSOR_ARCHITECTURE%"=="AMD64" (
        set "nodeUrl=https://nodejs.org/dist/v18.17.1/node-v18.17.1-x64.msi"
        set "nodeFile=node-x64.msi"
    ) else (
        set "nodeUrl=https://nodejs.org/dist/v18.17.1/node-v18.17.1-x86.msi"
        set "nodeFile=node-x86.msi"
    )
    
    :: 下载Node.js
    echo Downloading Node.js...
    powershell -Command "Invoke-WebRequest -Uri '%nodeUrl%' -OutFile '%nodeFile%'"
    
    :: 安装Node.js
    echo Installing Node.js...
    msiexec /i "%nodeFile%" /quiet /norestart
    
    :: 等待安装完成
    timeout /t 10 /nobreak > nul
    
    :: 清理
    del "%nodeFile%" >nul 2>&1
    
    :: 验证安装
    where node >nul 2>nul
    if %errorlevel% neq 0 (
        echo Node.js installation failed. Please install manually from nodejs.org
        pause
        exit /b 1
    )
    echo Node.js installed successfully!
) else (
    echo Node.js already installed
)

:: 安装服务器依赖
echo.
echo Installing server dependencies...
cd /d "%~dp0server"
call npm install

:: 创建启动器
cd /d "%~dp0"
echo @echo off > start-portable.bat
echo cd /d "%%~dp0server" >> start-portable.bat
echo start cmd /k "npm start" >> start-portable.bat
echo echo Server started! Go to Chrome extension and refresh. >> start-portable.bat

echo @echo off > start-portable-bg.bat
echo cd /d "%%~dp0server" >> start-portable-bg.bat
echo start /b cmd /c npm start >> start-portable-bg.bat
echo echo Server started in background! >> start-portable-bg.bat

echo.
echo ========================================
echo Setup completed successfully!
echo.
echo To use on ANY computer:
echo 1. Copy this entire folder to the new computer
echo 2. Run setup-portable.bat (this script)
echo 3. Run start-portable.bat to start server
echo 4. Install Chrome extension
echo 5. Done! Extension will work
echo.
echo The server will run on: http://localhost:3001
echo No additional software needed!
echo ========================================
echo.
echo Starting server now for testing...
call start-portable-bg.bat
echo.
echo Testing connection...
timeout /t 5 /nobreak > nul
powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:3001/api/files?path=C:\' -UseBasicParsing -TimeoutSec 3; Write-Host 'Server is working!' } catch { Write-Host 'Server test failed' }"
echo.
pause