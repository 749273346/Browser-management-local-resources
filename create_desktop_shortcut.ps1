$WshShell = New-Object -ComObject WScript.Shell
$DesktopPath = [Environment]::GetFolderPath("Desktop")
# Use English filename to avoid encoding issues in PowerShell 5.1
$ShortcutPath = Join-Path $DesktopPath "Local Resource Manager.lnk"
$Shortcut = $WshShell.CreateShortcut($ShortcutPath)

$RepoRoot = "e:\QC-攻关小组\正在进行项目\浏览器资源管理\Browser-management-local-resources"
$VbsPath = Join-Path $RepoRoot "start-gui.vbs"
# Windows shortcuts (.lnk) generally require .ico, .exe, or .dll for icons. 
# .png is often not supported. We'll use powershell.exe's icon or a system icon if no .ico found.
# But let's try to point to the VBS script itself, or just leave default.
# Actually, let's use shell32.dll icon 15 (network drive/computer) or similar backend-ish icon.
# Or just let it be the default WScript script icon.

$Shortcut.TargetPath = "wscript.exe"
$Shortcut.Arguments = "//nologo `"$VbsPath`""
$Shortcut.WorkingDirectory = $RepoRoot
$Shortcut.Description = "Start Local Resource Manager Service (Silent)"

$Shortcut.Save()
Write-Host "Shortcut created at $ShortcutPath"
