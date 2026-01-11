@echo off 
cd /d "%~dp0server" 
start cmd /k "npm start" 
echo Server started! Go to Chrome extension and refresh. 
