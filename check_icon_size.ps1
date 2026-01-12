Add-Type -AssemblyName System.Drawing
$files = @(
    "server\assets\icon.png",
    "extension\public\icon.png",
    "extension\dist\assets\icon.png"
)

foreach ($path in $files) {
    if (Test-Path $path) {
        try {
            $img = [System.Drawing.Bitmap]::FromFile($path)
            Write-Host "File: $path | Width: $($img.Width) Height: $($img.Height)"
            $img.Dispose()
        } catch {
            Write-Host "Error reading $path : $_"
        }
    } else {
        Write-Host "File not found: $path"
    }
}
