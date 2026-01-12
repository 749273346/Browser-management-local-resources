Add-Type -AssemblyName System.Drawing

$pngPath = Join-Path $PSScriptRoot "server\assets\icon.png"
$icoPath = Join-Path $PSScriptRoot "app.ico"

if (Test-Path $pngPath) {
    try {
        # Load original image
        $originalImg = [System.Drawing.Bitmap]::FromFile($pngPath)
        
        # Target size: 256x256 (Standard Large Icon)
        $targetSize = 256
        # Content size: 220x220 (Leave padding to prevent cutting off)
        $contentSize = 220
        
        $newBitmap = New-Object System.Drawing.Bitmap($targetSize, $targetSize)
        $graph = [System.Drawing.Graphics]::FromImage($newBitmap)
        
        # High quality settings
        $graph.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graph.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $graph.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $graph.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

        # Calculate centering position
        $x = ($targetSize - $contentSize) / 2
        $y = ($targetSize - $contentSize) / 2
        
        # Draw the image scaled and centered
        $rect = New-Object System.Drawing.Rectangle($x, $y, $contentSize, $contentSize)
        $graph.DrawImage($originalImg, $rect)
        
        # Create Icon from the new bitmap
        # Note: GetHicon creates an icon of the same size as the bitmap (256x256)
        $iconHandle = $newBitmap.GetHicon()
        $icon = [System.Drawing.Icon]::FromHandle($iconHandle)
        
        # Save Icon
        $fs = New-Object System.IO.FileStream($icoPath, "Create")
        $icon.Save($fs)
        $fs.Close()
        
        # Cleanup
        $icon.Dispose()
        # Note: DeleteObject is needed for HIcon in C++, but in .NET Icon.Dispose() might handle it or it's a managed wrapper.
        # Actually, FromHandle copies it? No.
        # To be safe, we just rely on GC/Dispose. 
        # But strictly speaking, [System.Runtime.InteropServices.Marshal]::DestroyIcon($iconHandle) might be needed if we were doing P/Invoke directly.
        # System.Drawing.Icon.FromHandle claims ownership? Docs say: "When using this method, you must dispose of the original icon handle by using the DestroyIcon method in the Win32 API."
        # However, for a simple script, process exit cleans up.
        
        $graph.Dispose()
        $newBitmap.Dispose()
        $originalImg.Dispose()
        
        Write-Host "Icon converted successfully to: $icoPath (Resized to 256x256 with padding)"
    } catch {
        Write-Error "Failed to convert icon: $_"
        exit 1
    }
} else {
    Write-Error "Source icon not found: $pngPath"
    exit 1
}
