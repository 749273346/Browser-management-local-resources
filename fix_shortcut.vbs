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
' Icon: prefer app_drawn.ico, fallback to app.ico
iconPath = strCurrentDir & "\app_drawn.ico"
If Not fso.FileExists(iconPath) Then
  iconPath = strCurrentDir & "\app.ico"
End If
If fso.FileExists(iconPath) Then
  oShellLink.IconLocation = iconPath
End If
' Description
oShellLink.Description = "Local Resource Manager Service"

oShellLink.Save
WScript.Echo "Shortcut created successfully on Desktop."
