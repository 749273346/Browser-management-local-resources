Set WshShell = CreateObject("WScript.Shell")
strPath = WshShell.CurrentDirectory
' 使用 PowerShell 执行 setup-gui.ps1，-WindowStyle Hidden 确保无窗口
command = "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File """ & strPath & "\setup-gui.ps1"""
WshShell.Run command, 0, False
