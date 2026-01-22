Add-Type -AssemblyName System.Drawing

# Define P/Invoke for SHChangeNotify to robustly refresh icons
$code = @"
using System;
using System.Runtime.InteropServices;

public class IconHelper {
    [DllImport("shell32.dll")]
    public static extern void SHChangeNotify(int wEventId, uint uFlags, IntPtr dwItem1, IntPtr dwItem2);

    public const int SHCNE_ASSOCCHANGED = 0x08000000;
    public const uint SHCNF_IDLIST = 0x0000;

    public static void RefreshIcons() {
        SHChangeNotify(SHCNE_ASSOCCHANGED, SHCNF_IDLIST, IntPtr.Zero, IntPtr.Zero);
    }
}
"@

try {
    Add-Type -TypeDefinition $code -Language CSharp
} catch {
    # If the type is already added, this will throw, but that's fine as long as it exists.
    # We can check if it exists to be sure.
    if (-not ([System.Management.Automation.PSTypeName]'IconHelper').Type) {
        Write-Warning "Failed to add IconHelper type: $_"
    }
}

$WshShell = New-Object -ComObject WScript.Shell
$DesktopPath = [Environment]::GetFolderPath("Desktop")
$ShortcutPath = Join-Path $DesktopPath "Local Resource Manager.lnk"

# Paths
$pngPath = Join-Path $PSScriptRoot "server\assets\icon.png"
$icoPath = Join-Path $PSScriptRoot "app_fixed.ico"

# 1. Generate the new ICO file with significant padding and offset
if (Test-Path $pngPath) {
    try {
        $originalImg = [System.Drawing.Bitmap]::FromFile($pngPath)
        
        # Target: 256x256
        $targetSize = 256
        
        # Content: 120x120 (Even smaller to be absolutely safe and "small" as requested)
        # This will make the visual icon appear smaller on the desktop, leaving plenty of room for the arrow.
        $contentSize = 120
        
        $newBitmap = New-Object System.Drawing.Bitmap($targetSize, $targetSize)
        $graph = [System.Drawing.Graphics]::FromImage($newBitmap)
        
        $graph.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graph.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $graph.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $graph.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

        # Position: Top-Right biased
        # Center would be (256-120)/2 = 68
        # We want to move it Right (+) and Up (-)
        # Let's put it at X=100, Y=30
        # X=100 means right margin is 256 - (100+120) = 36px
        # Y=30 means top margin is 30px
        # Bottom margin is 256 - (30+120) = 106px (Huge space for arrow)
        # Left margin is 100px (Huge space)
        
        $x = 100
        $y = 30
        
        $rect = New-Object System.Drawing.Rectangle($x, $y, $contentSize, $contentSize)
        $graph.DrawImage($originalImg, $rect)
        
        $fs = New-Object System.IO.FileStream($icoPath, "Create")
        # Save as Icon
        $iconHandle = $newBitmap.GetHicon()
        $icon = [System.Drawing.Icon]::FromHandle($iconHandle)
        $icon.Save($fs)
        $fs.Close()
        
        $icon.Dispose()
        $graph.Dispose()
        $newBitmap.Dispose()
        $originalImg.Dispose()
        
        Write-Host "New icon created at: $icoPath"
    } catch {
        Write-Error "Failed to create icon: $_"
        exit 1
    }
} else {
    Write-Error "Source image not found."
    exit 1
}

# 2. Update the Shortcut
if (Test-Path $ShortcutPath) {
    try {
        $Shortcut = $WshShell.CreateShortcut($ShortcutPath)
        $Shortcut.IconLocation = "$icoPath, 0"
        $Shortcut.Save()
        Write-Host "Shortcut updated successfully."
        
        # 3. Force Refresh Icon Cache (Trigger update by touching the file)
        (Get-ChildItem $ShortcutPath).LastWriteTime = Get-Date
        
        # 4. Notify Shell of association change (The robust "Big Tech" way)
        Write-Host "Triggering Shell Icon Refresh..."
        [IconHelper]::RefreshIcons()
    } catch {
        Write-Error "Failed to update shortcut: $_"
    }
} else {
    Write-Warning "Desktop shortcut not found at $ShortcutPath"
}
