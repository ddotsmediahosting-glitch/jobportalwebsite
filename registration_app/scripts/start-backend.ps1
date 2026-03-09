#Requires -Version 5.1
<#
.SYNOPSIS
    Starts the Express backend on http://localhost:4000
    Run this script from the registration_app root or anywhere.
#>

$scriptDir  = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Join-Path $scriptDir '..\backend'

Write-Host "Starting backend at http://localhost:4000 ..." -ForegroundColor Cyan
Set-Location $backendDir
node src/server.js
