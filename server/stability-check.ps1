$ErrorActionPreference = "Stop"

$healthUrl = "http://127.0.0.1:3001/health"
$maxAttempts = 10

for ($i = 1; $i -le $maxAttempts; $i++) {
  try {
    $h = Invoke-RestMethod $healthUrl -TimeoutSec 2
    $json = $h | ConvertTo-Json -Compress
    Write-Host "HEALTH OK: $json"
    exit 0
  } catch {
    Start-Sleep -Milliseconds 400
  }
}

Write-Error "HEALTH FAILED: $healthUrl"
exit 1

