Add-Type -AssemblyName System.Drawing
$pngPath = Join-Path $PSScriptRoot "server\assets\icon.png"
$icoPath = Join-Path $PSScriptRoot "app.ico"

if (Test-Path $pngPath) {
    try {
        $img = [System.Drawing.Bitmap]::FromFile($pngPath)
        $icon = [System.Drawing.Icon]::FromHandle($img.GetHicon())
        $fs = New-Object System.IO.FileStream($icoPath, "Create")
        $icon.Save($fs)
        $fs.Close()
        $img.Dispose()
        $icon.Dispose()
        Write-Host "Icon converted successfully to: $icoPath"
    } catch {
        Write-Error "Failed to convert icon: $_"
        exit 1
    }
} else {
    Write-Error "Source icon not found: $pngPath"
    exit 1
}
