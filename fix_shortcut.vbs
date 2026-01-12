Set WshShell = CreateObject("WScript.Shell")
strDesktop = WshShell.SpecialFolders("Desktop")
' Create the shortcut with English name to be safe, user can rename it
Set oShellLink = WshShell.CreateShortcut(strDesktop & "\Local Resource Manager.lnk")

Set fso = CreateObject("Scripting.FileSystemObject")
strCurrentDir = fso.GetAbsolutePathName(".")

' Target: wscript.exe (no console window)
oShellLink.TargetPath = "wscript.exe"
' Arguments: run the VBS launcher silently
oShellLink.Arguments = "//nologo //b """ & strCurrentDir & "\start-gui.vbs"""
' Working Directory: IMPORTANT for relative paths
oShellLink.WorkingDirectory = strCurrentDir
' Icon: use the newly converted .ico
oShellLink.IconLocation = strCurrentDir & "\app.ico"
' Description
oShellLink.Description = "Local Resource Manager Service"

oShellLink.Save
WScript.Echo "Shortcut created successfully on Desktop."
