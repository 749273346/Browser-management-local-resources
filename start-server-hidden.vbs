Set WshShell = CreateObject("WScript.Shell")
Set env = WshShell.Environment("Process")
env("ELECTRON_ENABLE_LOGGING") = "1"
env("LRM_DEBUG") = "1"
Dim rootDir, serverDir, strArgs, silent, i, a, electronCmd, electronExe, cmdLine, shown, exitCode, delayMs, maxDelayMs, startAt, ranSeconds
Dim installStartup

rootDir = Replace(WScript.ScriptFullName, WScript.ScriptName, "")
serverDir = rootDir & "server"

silent = False
installStartup = False
If WScript.Arguments.Count > 0 Then
  For i = 0 To WScript.Arguments.Count - 1
    a = LCase(WScript.Arguments(i))
    If a = "/silent" Or a = "-silent" Or a = "silent" Then
      silent = True
    ElseIf a = "/installstartup" Or a = "-installstartup" Or a = "installstartup" Or a = "/install-startup" Then
      installStartup = True
    End If
  Next
End If

If installStartup Then
  Dim startupDir, lnkPath, s, regValue, vbsPath
  startupDir = WshShell.SpecialFolders("Startup")
  lnkPath = startupDir & "\LocalResourceManager.lnk"
  vbsPath = rootDir & "start-server-hidden.vbs"
  regValue = Chr(34) & WScript.FullName & Chr(34) & " //B //NoLogo " & Chr(34) & vbsPath & Chr(34) & " /silent"
  On Error Resume Next
  WshShell.RegWrite "HKCU\Software\Microsoft\Windows\CurrentVersion\Run\LocalResourceManager", regValue, "REG_SZ"
  Err.Clear
  Set s = WshShell.CreateShortcut(lnkPath)
  s.TargetPath = WScript.FullName
  s.Arguments = "//B //NoLogo " & Chr(34) & vbsPath & Chr(34) & " /silent"
  s.WorkingDirectory = rootDir
  s.Description = "Local Resource Manager Background Service"
  s.Save
  Set s = Nothing
  On Error GoTo 0
  WScript.Quit 0
End If

electronCmd = serverDir & "\node_modules\.bin\electron.cmd"
electronExe = serverDir & "\node_modules\electron\dist\electron.exe"

If CreateObject("Scripting.FileSystemObject").FileExists(electronExe) Then
  cmdLine = Chr(34) & electronExe & Chr(34) & " " & Chr(34) & serverDir & Chr(34)
ElseIf CreateObject("Scripting.FileSystemObject").FileExists(electronCmd) Then
  cmdLine = Chr(34) & electronCmd & Chr(34) & " " & Chr(34) & serverDir & Chr(34)
Else
  cmdLine = "npm run app"
End If

WshShell.CurrentDirectory = serverDir
shown = False
delayMs = 1000
maxDelayMs = 60000

Do
  If (Not silent) And (Not shown) Then
    shown = True
    MsgBox "Service started. Check the system tray." & vbCrLf & vbCrLf & "Tip: Double-click the icon to open console.", vbInformation, "Local Resource Manager"
  End If

  startAt = Now
  exitCode = WshShell.Run(cmdLine, 0, True)
  ranSeconds = DateDiff("s", startAt, Now)

  If exitCode = 100 Then
    Exit Do
  End If

  ' Exit code 202 means instance already running (single instance lock)
  If exitCode = 202 Then
    Exit Do
  End If

  If exitCode = 101 Then
    WScript.Sleep 3000
  Else
    WScript.Sleep delayMs
  End If

  If ranSeconds >= 120 Then
    delayMs = 1000
  Else
    If delayMs < maxDelayMs Then
      delayMs = delayMs * 2
      If delayMs > maxDelayMs Then delayMs = maxDelayMs
    End If
  End If
Loop

Set WshShell = Nothing
