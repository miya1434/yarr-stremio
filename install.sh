#!/bin/bash
# YARR! One-Click Installer

set -e

echo "🏴‍☠️ YARR! - Yet Another Rapid Retriever"
echo "========================================="
echo "One-Click Installer"
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
  echo "⚠️  Please don't run as root"
  exit 1
fi

# Detect OS
OS="$(uname -s)"
case "${OS}" in
    Linux*)     PLATFORM=Linux;;
    Darwin*)    PLATFORM=Mac;;
    *)          PLATFORM="UNKNOWN:${OS}"
esac

echo "🖥️  Detected platform: ${PLATFORM}"
echo ""

# Check for Docker
if command -v docker &> /dev/null; then
    echo "✅ Docker found"
    INSTALL_METHOD="docker"
elif command -v node &> /dev/null; then
    echo "✅ Node.js found"
    INSTALL_METHOD="node"
else
    echo "❌ Neither Docker nor Node.js found"
    echo ""
    echo "Please install either:"
    echo "  - Docker: https://docs.docker.com/get-docker/"
    echo "  - Node.js: https://nodejs.org/"
    exit 1
fi

echo ""
echo "📥 Installing YARR!..."
echo ""

if [ "$INSTALL_METHOD" = "docker" ]; then
    echo "🐳 Using Docker installation method"
    echo ""
    
    # Create docker-compose.yml
    cat > docker-compose.yml << 'EOF'
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
EOF

    echo "✅ Created docker-compose.yml"
    echo "🚀 Starting YARR!..."
    docker-compose up -d
    
    echo ""
    echo "✅ YARR! is running!"
    echo ""
    echo "📍 Access at: http://localhost:58827/configure"
    echo ""
    echo "🎮 Next steps:"
    echo "   1. Open http://localhost:58827/configure"
    echo "   2. Complete the 5-step setup wizard"
    echo "   3. Click 'Install to Stremio'"
    echo "   4. Start streaming!"
    echo ""

elif [ "$INSTALL_METHOD" = "node" ]; then
    echo "📦 Using Node.js installation method"
    echo ""
    
    # Check for pnpm
    if ! command -v pnpm &> /dev/null; then
        echo "📥 Installing pnpm..."
        npm install -g pnpm
    fi
    
    echo "✅ pnpm ready"
    echo "📥 Installing dependencies (this may take a few minutes)..."
    
    # Install with ignore scripts first to avoid build errors
    pnpm install --ignore-scripts
    
    echo "🔧 Rebuilding native modules..."
    pnpm rebuild
    
    echo "🔨 Building project..."
    pnpm build
    
    echo "🚀 Starting YARR!..."
    pnpm start &
    
    echo ""
    echo "✅ YARR! is running!"
    echo ""
    echo "📍 Access at: http://localhost:58827/configure"
    echo ""
    echo "🎮 Next steps:"
    echo "   1. Open http://localhost:58827/configure"
    echo "   2. Complete the 5-step setup wizard"
    echo "   3. Click 'Install to Stremio'"
    echo "   4. Start streaming!"
    echo ""
fi

echo "════════════════════════════════════════"
echo "🏴‍☠️ YARR! Installation Complete!"
echo "════════════════════════════════════════"
echo ""
echo "⭐ GitHub: https://github.com/spookyhost1/yarr-stremio"
echo ""
echo "Happy streaming, matey! ⚡"

