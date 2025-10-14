# YARR! One-Click Installer for Windows

Write-Host "🏴‍☠️ YARR! - Yet Another Rapid Retriever" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "One-Click Installer for Windows"
Write-Host ""

# Check for Docker
$dockerInstalled = Get-Command docker -ErrorAction SilentlyContinue
$nodeInstalled = Get-Command node -ErrorAction SilentlyContinue

if ($dockerInstalled) {
    Write-Host "✅ Docker found" -ForegroundColor Green
    $installMethod = "docker"
}
elseif ($nodeInstalled) {
    Write-Host "✅ Node.js found" -ForegroundColor Green
    $installMethod = "node"
}
else {
    Write-Host "❌ Neither Docker nor Node.js found" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install either:"
    Write-Host "  - Docker: https://docs.docker.com/desktop/install/windows-install/"
    Write-Host "  - Node.js: https://nodejs.org/"
    exit 1
}

Write-Host ""
Write-Host "📥 Installing YARR!..." -ForegroundColor Yellow
Write-Host ""

if ($installMethod -eq "docker") {
    Write-Host "🐳 Using Docker installation method" -ForegroundColor Cyan
    Write-Host ""
    
    # Create docker-compose.yml
    @"
version: '3.8'

services:
  yarr:
    build: .
    container_name: yarr
    ports:
      - "58827:58827"
    environment:
      - ZILEAN_URL=https://zilean.elfhosted.com
    restart: unless-stopped

volumes:
  data:
"@ | Out-File -FilePath "docker-compose.yml" -Encoding UTF8

    Write-Host "✅ Created docker-compose.yml" -ForegroundColor Green
    Write-Host "🚀 Starting YARR!..." -ForegroundColor Yellow
    docker-compose up -d
    
    Write-Host ""
    Write-Host "✅ YARR! is running!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📍 Access at: http://localhost:58827/configure" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🎮 Next steps:" -ForegroundColor Yellow
    Write-Host "   1. Open http://localhost:58827/configure"
    Write-Host "   2. Complete the 5-step setup wizard"
    Write-Host "   3. Click 'Install to Stremio'"
    Write-Host "   4. Start streaming!"
    Write-Host ""

}
elseif ($installMethod -eq "node") {
    Write-Host "📦 Using Node.js installation method" -ForegroundColor Cyan
    Write-Host ""
    
    # Check for pnpm
    $pnpmInstalled = Get-Command pnpm -ErrorAction SilentlyContinue
    if (-not $pnpmInstalled) {
        Write-Host "📥 Installing pnpm..." -ForegroundColor Yellow
        npm install -g pnpm
    }
    
    Write-Host "✅ pnpm ready" -ForegroundColor Green
    Write-Host "📥 Installing dependencies..." -ForegroundColor Yellow
    pnpm install
    
    Write-Host "🔨 Building project..." -ForegroundColor Yellow
    pnpm build
    
    Write-Host "🚀 Starting YARR!..." -ForegroundColor Yellow
    Start-Process -NoNewWindow pnpm -ArgumentList "start"
    
    Write-Host ""
    Write-Host "✅ YARR! is running!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📍 Access at: http://localhost:58827/configure" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🎮 Next steps:" -ForegroundColor Yellow
    Write-Host "   1. Open http://localhost:58827/configure"
    Write-Host "   2. Complete the 5-step setup wizard"
    Write-Host "   3. Click 'Install to Stremio'"
    Write-Host "   4. Start streaming!"
    Write-Host ""
}

Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🏴‍☠️ YARR! Installation Complete!" -ForegroundColor Green
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "⭐ GitHub: https://github.com/spookyhost1/yarr-stremio"
Write-Host ""
Write-Host "Happy streaming, matey! 🏴‍☠️" -ForegroundColor Yellow

