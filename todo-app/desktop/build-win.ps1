# TodoApp Windows Installer Build Script
# Run this script as Administrator OR enable Developer Mode in Windows Settings first.
# 
# To run as Administrator:
#   Right-click PowerShell → "Run as Administrator"
#   Then: cd "C:\Users\web\Desktop\Node apps\jobportal\todo-app\desktop"
#         .\build-win.ps1

Write-Host "Building TodoApp Windows Installer..." -ForegroundColor Cyan

# Build the React frontend
Write-Host "`n[1/2] Building React frontend..." -ForegroundColor Yellow
Set-Location "..\frontend"
npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "Frontend build failed!" -ForegroundColor Red; exit 1 }

# Build the Electron installer
Write-Host "`n[2/2] Building Electron installer..." -ForegroundColor Yellow
Set-Location "..\desktop"
$env:CSC_IDENTITY_AUTO_DISCOVERY = "false"
npx electron-builder --win --x64

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Build complete! Installer is in: todo-app\desktop\dist\" -ForegroundColor Green
} else {
    Write-Host "`n❌ Build failed. See errors above." -ForegroundColor Red
    Write-Host "If you see 'Cannot create symbolic link', enable Developer Mode:" -ForegroundColor Yellow
    Write-Host "  Settings → System → For developers → Developer Mode → ON" -ForegroundColor Yellow
}
