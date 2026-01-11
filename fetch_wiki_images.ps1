
$images = @(
    @{
        Url = "https://commons.wikimedia.org/wiki/File:China_Railways_SS6B-6002_in_Guangzhou_Railway_Museum_20220520-01.jpg"
        Output = "gz_museum_ss6b.jpg"
    },
    @{
        Url = "https://commons.wikimedia.org/wiki/File:Building_Huizhounan.jpg"
        Output = "huizhou_station_old.jpg"
    }
)

$destDir = "extension/public/wallpapers"
if (!(Test-Path $destDir)) {
    New-Item -ItemType Directory -Force -Path $destDir
}

foreach ($img in $images) {
    $pageUrl = $img.Url
    $outputFile = Join-Path $destDir $img.Output
    
    Write-Host "Fetching page: $pageUrl"
    
    try {
        # Get page content with User-Agent
        $response = Invoke-WebRequest -Uri $pageUrl -UseBasicParsing -UserAgent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        $html = $response.Content
        
        # Find the original file URL
        # Pattern: <a href="https://upload.wikimedia.org/wikipedia/commons/2/25/China_Railways_SS6B-6002_in_Guangzhou_Railway_Museum_20220520-01.jpg" class="internal"
        if ($html -match 'href="(https://upload\.wikimedia\.org/wikipedia/commons/[^"]+)" class="internal"') {
            $fileUrl = $matches[1]
            Write-Host "Found image URL: $fileUrl"
            
            # Download file
            Invoke-WebRequest -Uri $fileUrl -OutFile $outputFile
            Write-Host "Downloaded to: $outputFile"
        } else {
            Write-Error "Could not find image URL in page content for $pageUrl"
        }
    } catch {
        Write-Error "Failed to process $pageUrl : $_"
    }
}
