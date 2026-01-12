Set WshShell = CreateObject("WScript.Shell")
Set FSO = CreateObject("Scripting.FileSystemObject")
strPath = FSO.GetParentFolderName(WScript.ScriptFullName)

' Construct command to run PowerShell script hidden
strCommand = "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File """ & strPath & "\setup-gui.ps1"""

' Run completely hidden (0)
WshShell.Run strCommand, 0, False
