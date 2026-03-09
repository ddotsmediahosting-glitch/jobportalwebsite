#Requires -Version 5.1
<#
.SYNOPSIS
    One-shot installer for the Registration App on Windows 11.
    Run from any location in PowerShell (not PowerShell ISE).
    Installs: Node.js LTS, Git, VS Code extensions.
    Does NOT require admin rights for winget.
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-Step { param([string]$msg) Write-Host "`n==> $msg" -ForegroundColor Cyan }
function Write-OK   { param([string]$msg) Write-Host "    [OK] $msg" -ForegroundColor Green }
function Write-Warn { param([string]$msg) Write-Host "    [!!] $msg" -ForegroundColor Yellow }

# ── 0. Verify winget ─────────────────────────────────────────────────────────
Write-Step "Checking winget"
if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
    Write-Error "winget not found. Install it from the Microsoft Store (App Installer)."
}
Write-OK "winget $(winget --version)"

# ── 1. Node.js LTS ───────────────────────────────────────────────────────────
Write-Step "Installing / verifying Node.js LTS"
$nodeInstalled = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeInstalled) {
    winget install --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements --silent
    # Refresh PATH in current session
    $env:PATH = [System.Environment]::GetEnvironmentVariable('PATH','Machine') + ';' +
                [System.Environment]::GetEnvironmentVariable('PATH','User')
} else {
    Write-Warn "Node already installed – skipping."
}

$nodeVer = node --version 2>&1
$npmVer  = npm --version  2>&1
Write-OK "node $nodeVer   npm $npmVer"

# ── 2. Git ───────────────────────────────────────────────────────────────────
Write-Step "Installing / verifying Git"
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    winget install --id Git.Git --accept-source-agreements --accept-package-agreements --silent
    $env:PATH = [System.Environment]::GetEnvironmentVariable('PATH','Machine') + ';' +
                [System.Environment]::GetEnvironmentVariable('PATH','User')
} else {
    Write-Warn "Git already installed – skipping."
}
Write-OK "git $(git --version)"

# ── 3. VS Code extensions ────────────────────────────────────────────────────
Write-Step "Installing VS Code extensions (ESLint + Prettier)"
if (Get-Command code -ErrorAction SilentlyContinue) {
    code --install-extension dbaeumer.vscode-eslint  --force
    code --install-extension esbenp.prettier-vscode  --force
    Write-OK "Extensions installed."
} else {
    Write-Warn "VS Code 'code' CLI not found – install extensions manually."
}

# ── 4. npm install – backend ──────────────────────────────────────────────────
Write-Step "Installing backend npm packages"
$scriptDir  = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Join-Path $scriptDir '..\backend'
Push-Location $backendDir
npm install
Pop-Location
Write-OK "Backend packages installed."

# ── 5. npm install – frontend ─────────────────────────────────────────────────
Write-Step "Installing frontend npm packages"
$frontendDir = Join-Path $scriptDir '..\frontend'
Push-Location $frontendDir
npm install
Pop-Location
Write-OK "Frontend packages installed."

Write-Host "`nAll done! Run .\scripts\start-backend.ps1 and .\scripts\start-frontend.ps1 in separate terminals." -ForegroundColor Green
