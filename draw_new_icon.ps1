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
     if (-not ([System.Management.Automation.PSTypeName]'IconHelper').Type) {
        Write-Warning "Failed to add IconHelper type: $_"
    }
}

$targetPath = Join-Path $PSScriptRoot "app_drawn.ico"

# Create Bitmap 256x256
$size = 256
$bmp = New-Object System.Drawing.Bitmap($size, $size)
$g = [System.Drawing.Graphics]::FromImage($bmp)

# High Quality Settings
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

# Clear Transparent
$g.Clear([System.Drawing.Color]::Transparent)

# Define Color and Pen
# Using DarkCyan (similar to the screenshot)
$color = [System.Drawing.Color]::FromArgb(255, 0, 139, 139) 
# Make the line thick enough to be visible
$pen = New-Object System.Drawing.Pen($color, 14)
$pen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
$pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
$pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round

# Define Geometry
# We want to position it slightly Top-Right to avoid the shortcut arrow (Bottom-Left)
# Icon Size: ~140x120
$iconW = 140
$iconH = 120

# Margins to push it to Top-Right
$x = [int]86
$y = [int]40

# Folder Tab Dimensions
$tabH = [int]20
$tabW = [int]60

# Calculate Coordinates (Pre-calculate as int to avoid syntax issues)
$x_tabR = [int]($x + $tabW)
$y_tabB = [int]($y + $tabH)
$x_tabSlope = [int]($x + $tabW + 10)
$x_bodyR = [int]($x + $iconW)
$y_bodyB = [int]($y + $iconH)

# Points
# 1. Tab Top-Left
$p1 = New-Object System.Drawing.Point -ArgumentList $x, $y
# 2. Tab Top-Right
$p2 = New-Object System.Drawing.Point -ArgumentList $x_tabR, $y
# 3. Tab Slope Bottom (Connect to body)
$p3 = New-Object System.Drawing.Point -ArgumentList $x_tabSlope, $y_tabB
# 4. Body Top-Right
$p4 = New-Object System.Drawing.Point -ArgumentList $x_bodyR, $y_tabB
# 5. Body Bottom-Right
$p5 = New-Object System.Drawing.Point -ArgumentList $x_bodyR, $y_bodyB
# 6. Body Bottom-Left (THE MISSING LINE END)
$p6 = New-Object System.Drawing.Point -ArgumentList $x, $y_bodyB
# 7. Body Top-Left (Back to Tab start vertical)

# Let's construct a path
$path = New-Object System.Drawing.Drawing2D.GraphicsPath

# Draw Tab Top
$path.AddLine($p1, $p2)
# Draw Tab Slope
$path.AddLine($p2, $p3)
# Draw Body Top Line
$path.AddLine($p3, $p4)
# Draw Body Right
$path.AddLine($p4, $p5)
# Draw Body Bottom (Explicitly drawing the bottom line)
$path.AddLine($p5, $p6)
# Draw Body Left / Tab Left (Vertical up to start)
$path.AddLine($p6, $p1)

$path.CloseFigure()

# Draw the path
$g.DrawPath($pen, $path)

# Save as ICO
try {
    $fs = New-Object System.IO.FileStream($targetPath, "Create")
    $iconHandle = $bmp.GetHicon()
    $icon = [System.Drawing.Icon]::FromHandle($iconHandle)
    $icon.Save($fs)
    $fs.Close()
    
    # Cleanup
    $icon.Dispose()
    $g.Dispose()
    $bmp.Dispose()
    $pen.Dispose()
    $path.Dispose()
    
    Write-Host "Icon created successfully at $targetPath"
} catch {
    Write-Error "Failed to save icon: $_"
    exit 1
}

# Update Shortcut
$WshShell = New-Object -ComObject WScript.Shell
$DesktopPath = [Environment]::GetFolderPath("Desktop")
$ShortcutPath = Join-Path $DesktopPath "Local Resource Manager.lnk"

if (Test-Path $ShortcutPath) {
    $Shortcut = $WshShell.CreateShortcut($ShortcutPath)
    $Shortcut.IconLocation = "$targetPath, 0"
    $Shortcut.Save()
    Write-Host "Shortcut updated."
    
    # Touch to refresh
    (Get-ChildItem $ShortcutPath).LastWriteTime = Get-Date
    
    # Notify Shell
    Write-Host "Triggering Shell Icon Refresh..."
    [IconHelper]::RefreshIcons()
}
