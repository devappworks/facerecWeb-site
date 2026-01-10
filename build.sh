#!/bin/bash

# Build script for Training UI
# This script builds the React app and outputs to training-dist/

echo "🔨 Building Training UI..."

# Load NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Navigate to training-ui directory
cd "$(dirname "$0")/training-ui"

# Run build
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo "📦 Output: ../training-dist/"
    echo "🌐 Live at: https://photolytics.mpanel.app/training/"
else
    echo "❌ Build failed!"
    exit 1
fi
