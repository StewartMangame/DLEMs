$ErrorActionPreference = "Continue"

$port = 3002

$owners = netstat -ano |
  Select-String -Pattern ":$port\s" |
  ForEach-Object { ($_ -split "\s+")[-1] } |
  Where-Object { $_ -match "^\d+$" -and $_ -ne "0" } |
  Sort-Object -Unique

foreach ($owner in $owners) {
  try {
    Stop-Process -Id ([int] $owner) -Force -ErrorAction Stop
  } catch {
    taskkill /PID $owner /F | Out-Null
  }
}

$lockPath = Join-Path $PSScriptRoot "..\frontend\.next\dev\lock"
if (Test-Path -LiteralPath $lockPath) {
  Remove-Item -LiteralPath $lockPath -Force
}

if ($owners.Count -gt 0) {
  Write-Host "Cleared stale frontend dev port $port."
}
