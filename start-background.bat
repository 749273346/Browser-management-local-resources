@echo off
echo Starting Local Resource Manager Server in background...
cscript //nologo "%~dp0start-server-hidden.vbs"
echo Server started in background (no window)
echo You can close this window, server will keep running
timeout /t 3 /nobreak > nul