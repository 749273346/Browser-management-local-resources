@echo off
setlocal enabledelayedexpansion
echo ========================================
echo Local Resource Manager - Universal Setup
echo ========================================
echo.

:: 设置变量
set "appName=Local Resource Manager"
set "nodeVersion=18.17.1"
set "serverPort=3001"
set "setupDir=%~dp0"
set "serverDir=%~dp0server"
set "success=true"

:: 创建日志文件
set "logFile=%setupDir%setup.log"
echo [%date% %time%] Starting universal setup... > "%logFile%"

:: 步骤1: 检查系统要求
echo [1/5] Checking system requirements...
echo [%date% %time%] Checking system requirements... >> "%logFile%"

:: 检查操作系统版本
ver | findstr /i "6\.1\." > nul
if %errorlevel% equ 0 (
    echo ⚠️  Windows 7 detected - some features may be limited
    echo [%date% %time%] Windows 7 detected >> "%logFile%"
)

:: 检查是否有管理员权限
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  Running without administrator privileges
    echo [%date% %time%] No admin privileges >> "%logFile%"
) else (
    echo ✅ Administrator privileges available
    echo [%date% %time%] Admin privileges available >> "%logFile%"
)

:: 步骤2: 检查并安装Node.js
echo.
echo [2/5] Checking Node.js installation...
echo [%date% %time%] Checking Node.js >> "%logFile%"

:: 检查Node.js是否已安装
where node >nul 2>&1
if %errorlevel% equ 0 (
    :: 获取Node.js版本
    for /f "tokens=1" %%i in ('node --version') do set "nodeVersionInstalled=%%i"
    echo ✅ Node.js found: !nodeVersionInstalled!
    echo [%date% %time%] Node.js found: !nodeVersionInstalled! >> "%logFile%"
    
    :: 检查版本是否兼容（需要v12以上）
    node -e "process.exit(process.version.match(/v(+)/)[1] >= 12 ? 0 : 1)" >nul 2>&1
    if %errorlevel% neq 0 (
        echo ⚠️  Node.js version too old, updating...
        echo [%date% %time%] Node.js version too old >> "%logFile%"
        goto :installNodeJs
    )
) else (
    echo ❌ Node.js not found
    echo [%date% %time%] Node.js not found >> "%logFile%"
    goto :installNodeJs
)

:installNodeJs
echo 📦 Installing Node.js !nodeVersion!...
echo [%date% %time%] Installing Node.js !nodeVersion! >> "%logFile%"

:: 检测系统架构
if "%PROCESSOR_ARCHITECTURE%"=="AMD64" (
    set "nodeInstaller=node-v!nodeVersion!-x64.msi"
) else (
    set "nodeInstaller=node-v!nodeVersion!-x86.msi"
)

:: 下载Node.js安装程序
echo 📥 Downloading Node.js installer...
powershell -Command "try { Invoke-WebRequest -Uri 'https://nodejs.org/dist/v!nodeVersion!/!nodeInstaller!' -OutFile '!nodeInstaller!' -TimeoutSec 300; exit 0 } catch { exit 1 }" >nul 2>&1

if %errorlevel% neq 0 (
    echo ❌ Failed to download Node.js
    echo [%date% %time%] Failed to download Node.js >> "%logFile%"
    set "success=false"
    goto :errorHandler
)

:: 安装Node.js
echo 📦 Installing Node.js...
msiexec /i "!nodeInstaller!" /quiet /norestart
if %errorlevel% neq 0 (
    echo ⚠️  Node.js installation may have failed, continuing...
    echo [%date% %time%] Node.js installation warning >> "%logFile%"
)

:: 等待安装完成
timeout /t 10 /nobreak > nul

:: 清理安装文件
if exist "!nodeInstaller!" del "!nodeInstaller!" >nul 2>&1

:: 验证安装
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js installation failed
    echo [%date% %time%] Node.js installation failed >> "%logFile%"
    set "success=false"
    goto :errorHandler
)

echo ✅ Node.js installed successfully

:: 步骤3: 安装服务器依赖
echo.
echo [3/5] Installing server dependencies...
echo [%date% %time%] Installing server dependencies >> "%logFile%"

if not exist "%serverDir%" (
    echo ❌ Server directory not found: %serverDir%
    echo [%date% %time%] Server directory not found >> "%logFile%"
    set "success=false"
    goto :errorHandler
)

cd /d "%serverDir%"
call npm install
if %errorlevel% neq 0 (
    echo ⚠️  npm install completed with warnings
    echo [%date% %time%] npm install warnings >> "%logFile%"
)

:: 步骤4: 配置防火墙和端口
echo.
echo [4/5] Configuring firewall and network...
echo [%date% %time%] Configuring network >> "%logFile%"

:: 检查端口是否被占用
netstat -ano | findstr ":%serverPort%" >nul
if %errorlevel% equ 0 (
    echo ⚠️  Port %serverPort% is already in use
    echo [%date% %time%] Port %serverPort% occupied >> "%logFile%"
    
    :: 尝试备用端口
    set "serverPort=3002"
    echo 🔄 Trying alternative port: %serverPort%
    echo [%date% %time%] Trying port %serverPort% >> "%logFile%"
)

:: 添加防火墙规则（需要管理员权限）
netsh advfirewall firewall add rule name="%appName% Server" dir=in action=allow protocol=TCP localport=%serverPort% >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Firewall rule added for port %serverPort%
    echo [%date% %time%] Firewall rule added >> "%logFile%"
) else (
    echo ⚠️  Could not add firewall rule (manual configuration may be needed)
    echo [%date% %time%] Firewall rule failed >> "%logFile%"
)

:: 步骤5: 创建启动脚本
echo.
echo [5/5] Creating startup scripts...
echo [%date% %time%] Creating startup scripts >> "%logFile%"

cd /d "%setupDir%"

:: 创建通用启动脚本
echo @echo off > start-universal.bat
echo :: %appName% Universal Startup Script >> start-universal.bat
echo cd /d "%serverDir%" >> start-universal.bat
echo start cmd /k "npm start" >> start-universal.bat
echo echo ✅ %appName% server started on port %serverPort% >> start-universal.bat
echo timeout /t 3 ^> nul >> start-universal.bat

:: 创建后台启动脚本
echo @echo off > start-universal-bg.bat
echo :: %appName% Universal Background Startup >> start-universal-bg.bat
echo cd /d "%serverDir%" >> start-universal-bg.bat
echo start /b cmd /c npm start >> start-universal-bg.bat
echo echo ✅ %appName% server started in background on port %serverPort% >> start-universal-bg.bat
echo timeout /t 3 ^> nul >> start-universal-bg.bat

:: 创建测试脚本
echo @echo off > test-server.bat
echo :: Testing %appName% server connection... >> test-server.bat
echo powershell -Command "try { (Invoke-WebRequest -Uri 'http://localhost:%serverPort%/api/files?path=C:\' -UseBasicParsing -TimeoutSec 5).StatusCode } catch { Write-Host '❌ Server not responding' }" >> test-server.bat

:: 创建停止脚本
echo @echo off > stop-server.bat
echo :: Stopping %appName% server... >> stop-server.bat
echo taskkill /F /IM node.exe ^>nul 2^>^&1 >> stop-server.bat
echo echo 🛑 Server stopped >> stop-server.bat

:: 创建卸载脚本
echo @echo off > uninstall.bat
echo :: Uninstalling %appName%... >> uninstall.bat
echo echo Stopping server... >> uninstall.bat
echo taskkill /F /IM node.exe ^>nul 2^>^&1 >> uninstall.bat
echo echo Removing firewall rule... >> uninstall.bat
echo netsh advfirewall firewall delete rule name="%appName% Server" ^>nul 2^>^&1 >> uninstall.bat
echo echo ✅ %appName% uninstalled >> uninstall.bat
echo pause >> uninstall.bat

:: 完成安装
echo.
echo ========================================
if "%success%"=="true" (
    echo ✅ %appName% installed successfully!
    echo.
    echo 🚀 Quick Start:
    echo   1. Double-click start-universal.bat to start server
    echo   2. Or use start-universal-bg.bat for background mode
    echo   3. Install Chrome extension
    echo   4. Test with test-server.bat
    echo.
    echo 📁 Created files:
    echo   - start-universal.bat     (Start with window)
    echo   - start-universal-bg.bat  (Start in background)
    echo   - test-server.bat         (Test connection)
    echo   - stop-server.bat         (Stop server)
    echo   - uninstall.bat           (Uninstall)
    echo   - setup.log               (Installation log)
    echo.
    echo 🔧 Troubleshooting:
    echo   - Check setup.log for detailed information
    echo   - Run test-server.bat to verify server
    echo   - Port %serverPort% should be available
    echo ========================================
) else (
    echo ❌ Installation completed with errors
    echo Check setup.log for details
    echo ========================================
)

:: 自动启动服务器
echo.
echo 🚀 Starting server for first test...
call start-universal-bg.bat

:: 等待服务器启动
echo ⏳ Waiting for server to start...
timeout /t 5 /nobreak > nul

:: 测试连接
echo 🧪 Testing server connection...
call test-server.bat

echo.
echo 💡 Installation complete! Press any key to exit...
pause > nul
exit /b 0

:errorHandler
echo.
echo ❌ Error occurred during installation
echo Check setup.log for details
echo.
echo 💡 Try:
echo   1. Run as administrator
echo   2. Check internet connection
echo   3. Disable antivirus temporarily
echo   4. Manual Node.js installation from nodejs.org
echo.
pause > nul
exit /b 1