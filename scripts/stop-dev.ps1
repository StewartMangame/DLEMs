$ErrorActionPreference = "Continue"

$ports = @(3000, 3001)

foreach ($port in $ports) {
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
}

$lockPath = Join-Path $PSScriptRoot "..\frontend\.next\dev\lock"
if (Test-Path -LiteralPath $lockPath) {
  Remove-Item -LiteralPath $lockPath -Force
}

Write-Host "Cleared frontend/backend dev ports and Next dev lock."
