Set WshShell = CreateObject("WScript.Shell")
Dim rootDir, serverDir, strArgs, silent, i, a

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

' Use PowerShell to launch npm run app hidden
' Electron handles Single Instance Lock internally, so we just launch it.
strArgs = "powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -Command " & _
  Chr(34) & _
  "$serverDir = '" & Replace(serverDir, "'", "''") & "'; " & _
  "Set-Location -LiteralPath $serverDir; " & _
  "$psi = New-Object System.Diagnostics.ProcessStartInfo; " & _
  "$psi.FileName = 'cmd'; " & _
  "$psi.Arguments = '/c npm run app'; " & _
  "$psi.WorkingDirectory = $serverDir; " & _
  "$psi.UseShellExecute = $false; " & _
  "$psi.CreateNoWindow = $true; " & _
  "$psi.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Hidden; " & _
  "[System.Diagnostics.Process]::Start($psi) | Out-Null; " & _
  "exit 0" & _
  Chr(34)

WshShell.Run strArgs, 0, False
Set WshShell = Nothing

If Not silent Then
  MsgBox "服务已启动，请查看系统托盘图标（右下角）。" & vbCrLf & vbCrLf & "提示：双击图标可打开控制台。", vbInformation, "Local Resource Manager"
End If
