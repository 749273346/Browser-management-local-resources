Set WshShell = CreateObject("WScript.Shell") 
Dim strArgs
strArgs = "cmd /c cd /d """ & Replace(WScript.ScriptFullName, WScript.ScriptName, "server") & """ && npm start"
WshShell.Run strArgs, 0, False
Set WshShell = Nothing
