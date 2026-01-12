Set WshShell = CreateObject("WScript.Shell")
Dim rootDir, serverDir, strArgs, silent, i, a, electronCmd, cmdLine, shown, exitCode, delayMs, maxDelayMs, startAt, ranSeconds

rootDir = Replace(WScript.ScriptFullName, WScript.ScriptName, "")
serverDir = rootDir & "server"

silent = False
If WScript.Arguments.Count > 0 Then
  For i = 0 To WScript.Arguments.Count - 1
    a = LCase(WScript.Arguments(i))
    If a = "/silent" Or a = "-silent" Or a = "silent" Then
      silent = True
    End If
  Next
End If

electronCmd = serverDir & "\node_modules\.bin\electron.cmd"

If CreateObject("Scripting.FileSystemObject").FileExists(electronCmd) Then
  cmdLine = Chr(34) & electronCmd & Chr(34) & " ."
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
    MsgBox "服务已启动，请查看系统托盘图标（右下角）。" & vbCrLf & vbCrLf & "提示：双击图标可打开控制台。", vbInformation, "Local Resource Manager"
  End If

  startAt = Now
  exitCode = WshShell.Run(cmdLine, 0, True)
  ranSeconds = DateDiff("s", startAt, Now)

  If exitCode = 100 Then
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
