@echo off
echo Starting Local Resource Manager Server Daemon...
cd /d "%~dp0"
node server-daemon.js
pause