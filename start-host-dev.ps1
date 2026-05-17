$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$logDir = Join-Path $root "logs"

if (-not (Test-Path $logDir)) {
  New-Item -ItemType Directory -Path $logDir | Out-Null
}

Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

$backendDir = Join-Path $root "backend-cloudflare"
$frontendDir = Join-Path $root "frontend"

Start-Process -FilePath npm `
  -ArgumentList "run", "dev" `
  -WorkingDirectory $backendDir `
  -WindowStyle Hidden `
  -RedirectStandardOutput (Join-Path $logDir "backend-cloudflare.out.log") `
  -RedirectStandardError (Join-Path $logDir "backend-cloudflare.err.log")

Start-Process -FilePath npm `
  -ArgumentList "run", "dev" `
  -WorkingDirectory $frontendDir `
  -WindowStyle Hidden `
  -RedirectStandardOutput (Join-Path $logDir "frontend.out.log") `
  -RedirectStandardError (Join-Path $logDir "frontend.err.log")

Write-Host "Frontend: http://localhost:5173"
Write-Host "Backend:  http://localhost:8787"
