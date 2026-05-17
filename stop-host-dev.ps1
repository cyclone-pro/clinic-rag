$ErrorActionPreference = "SilentlyContinue"

Get-Process node | Stop-Process -Force
Write-Host "Stopped local dev processes."
