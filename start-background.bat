@echo off
cd /d "%~dp0"

:: Launch the VBS launcher for a silent start
start "" wscript //nologo //b "start-gui.vbs"

:: Exit immediately
exit
