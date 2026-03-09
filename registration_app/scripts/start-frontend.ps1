#Requires -Version 5.1
<#
.SYNOPSIS
    Starts the Vite dev server on http://localhost:5173
    Run this script from the registration_app root or anywhere.
    Requires the backend to be running first.
#>

$scriptDir   = Split-Path -Parent $MyInvocation.MyCommand.Path
$frontendDir = Join-Path $scriptDir '..\frontend'

Write-Host "Starting frontend at http://localhost:5173 ..." -ForegroundColor Cyan
Set-Location $frontendDir
npm run dev
