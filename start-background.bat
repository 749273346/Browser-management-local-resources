@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

set "ROOT=%~dp0"
set "MARKER=%ROOT%.lrm_electron_ready"
set "STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "STARTUP_LNK=%STARTUP_DIR%\LocalResourceManager.lnk"
set "VBS=%ROOT%start-server-hidden.vbs"
set "WSCRIPT=%SystemRoot%\System32\wscript.exe"
set "HEALTH_URL=http://127.0.0.1:3001/health"

if /i "%~1"=="/silent" (
  call :EnsureStartup
  call :StartDetached
  call :WaitForHealth
  if errorlevel 1 exit /b 1
  exit /b 0
)

if exist "%MARKER%" (
  call :EnsureStartup
  echo [信息] 正在尝试启动/激活服务...
  call :StartDetached
  call :WaitForHealth
  if errorlevel 1 goto :HealthFail
  echo.
  echo 服务已在后台运行（请检查右下角托盘图标）。
  echo 如需重新安装依赖，请删除：%MARKER%
  echo.
  echo 按任意键退出...
  pause >nul
  exit /b 0
)

title 浏览器资源管理插件 - 服务升级配置 (Local Resource Manager Setup)

echo ===================================================
echo    浏览器资源管理插件 - 服务升级配置
echo ===================================================
echo.

echo [检查] 正在检测系统环境...
where node >nul 2>nul
if %errorlevel% neq 0 (
  echo [提示] 未检测到 Node.js，开始自动安装...
  goto :InstallNode
) else (
  echo [成功] Node.js 环境已就绪。
)

:CheckDependencies
if not exist "%ROOT%server\node_modules\electron" (
  echo [信息] 正在安装/升级服务依赖（Electron）...
  echo [提示] 这可能需要几分钟，取决于网络状况...
  pushd "%ROOT%server"
  call npm install
  if !errorlevel! neq 0 (
    popd
    goto :ErrorExit
  )
  popd
)

echo [信息] 正在配置开机自启（不会弹窗）...
call :EnsureStartup

echo [信息] 正在启动系统托盘服务...
call :StartDetached

call :WaitForHealth
if errorlevel 1 goto :HealthFail

> "%MARKER%" echo electron_ready

echo.
echo ===================================================
echo    配置完成！
echo ===================================================
echo.
echo 1. 服务已升级为系统托盘模式（右下角图标）。
echo 2. 点击托盘图标可打开管理控制台。
echo 3. 开机自启已配置。
echo.
echo [后续操作] 请在浏览器扩展管理页面加载以下目录（如未加载）：
echo    %ROOT%extension
echo.
echo 按任意键退出...
pause >nul
exit /b 0

:WaitForHealth
set "HEALTH_OK=0"
for /L %%i in (1,1,12) do (
  "%SystemRoot%\System32\curl.exe" -s -m 2 -o nul -f "%HEALTH_URL%" >nul 2>&1
  if !errorlevel! equ 0 (
    set "HEALTH_OK=1"
    goto :WaitForHealthDone
  )
  timeout /t 1 >nul
)
:WaitForHealthDone
if "%HEALTH_OK%"=="1" (exit /b 0) else (exit /b 1)

:HealthFail
echo.
echo ===================================================
echo    启动失败：未检测到后端服务
echo ===================================================
echo 1. 可能原因：Electron 启动被安全软件拦截，或服务立即崩溃。
echo 2. 请查看日志目录：
echo    %APPDATA%\LocalResourceManager\logs
echo 3. 如需手动验证，可在以下目录执行：
echo    %ROOT%server
echo    npm run app
echo.
echo 按任意键退出...
pause >nul
exit /b 1

:StartDetached
if exist "%STARTUP_LNK%" (
  "%SystemRoot%\System32\rundll32.exe" shell32.dll,ShellExec_RunDLL "%STARTUP_LNK%" >nul 2>&1
  exit /b 0
)
start "" "%WSCRIPT%" //B //NoLogo "%VBS%" /silent
exit /b 0

:EnsureStartup
if not exist "%STARTUP_DIR%" (
  mkdir "%STARTUP_DIR%" >nul 2>&1
)
"%WSCRIPT%" //B //NoLogo "%VBS%" /installstartup >nul 2>&1
del /f /q "%STARTUP_DIR%\start-background.bat" >nul 2>&1
del /f /q "%STARTUP_DIR%\start-background.lnk" >nul 2>&1
del /f /q "%STARTUP_DIR%\LocalResourceManagerSetup.lnk" >nul 2>&1
del /f /q "%STARTUP_DIR%\start-server-hidden.vbs" >nul 2>&1
del /f /q "%STARTUP_DIR%\LocalResourceManagerServer.lnk" >nul 2>&1
del /f /q "%STARTUP_DIR%\Local Resource Manager Server.lnk" >nul 2>&1
exit /b 0

:InstallNode
set "LOCAL_INSTALLER=%ROOT%resources\node-v18-x64.msi"
if exist "%LOCAL_INSTALLER%" (
  set "NODE_MSI=%LOCAL_INSTALLER%"
  goto :RunInstaller
)

echo [信息] 未找到离线安装包，尝试在线下载...
if "%PROCESSOR_ARCHITECTURE%"=="AMD64" (
  set "NODE_URL=https://nodejs.org/dist/v18.17.1/node-v18.17.1-x64.msi"
) else (
  set "NODE_URL=https://nodejs.org/dist/v18.17.1/node-v18.17.1-x86.msi"
)
set "NODE_MSI=%TEMP%\node-install.msi"
powershell -NoProfile -ExecutionPolicy Bypass -Command "try { Invoke-WebRequest -Uri '%NODE_URL%' -OutFile '%NODE_MSI%' -ErrorAction Stop } catch { exit 1 }"
if %errorlevel% neq 0 goto :ErrorExit

:RunInstaller
echo [信息] 正在安装 Node.js（请稍候）...
msiexec /i "%NODE_MSI%" /qb /norestart
if /i not "%NODE_MSI%"=="%LOCAL_INSTALLER%" del "%NODE_MSI%" >nul 2>&1

where node >nul 2>nul
if %errorlevel% neq 0 (
  echo [提示] Node.js 已安装，但当前窗口未刷新环境变量。
  echo [提示] 正在自动重启脚本，请稍候...
  timeout /t 2 >nul
  start "" "%~f0"
  exit /b
)
goto :CheckDependencies

:ErrorExit
echo.
echo ===================================================
echo    准备失败
echo ===================================================
echo 可能原因：网络不可用、权限不足、或安装被安全软件拦截。
echo 请截图此窗口并联系技术人员。
echo.
echo 按任意键退出...
pause >nul
exit /b 1
