#!/bin/bash

# Qwen Code build script
# Builds and cleans the project, indicating success or failure
#
# Usage: bash build.sh

set -o pipefail

echo "==========================================="
echo " Qwen Code Build Script"
echo "==========================================="

# --------------------------------------------------------------------------- 
# Install dependencies
# ---------------------------------------------------------------------------
echo ""
echo "--- Step 0: Installing dependencies ---"
if npm ci; then
    echo "✓ Dependencies installed successfully"
else
    echo "✗ Dependency installation failed"
    exit 1
fi

# --------------------------------------------------------------------------- 
# Cleanup function
# ---------------------------------------------------------------------------
cleanup() {
    if [[ "${CLEANUP_DONE}" != "true" ]]; then
        echo ""
        echo "==========================================="
        echo " ✗ Build FAILED"
        echo "==========================================="
    fi
}

trap cleanup EXIT

# --------------------------------------------------------------------------- 
# Clean step
# ---------------------------------------------------------------------------
echo ""
echo "--- Step 1: Cleaning previous build artifacts ---"
if npm run clean; then
    echo "✓ Clean completed successfully"
else
    echo "✗ Clean failed"
    exit 1
fi

# --------------------------------------------------------------------------- 
# Build step
# ---------------------------------------------------------------------------
echo ""
echo "--- Step 2: Building project ---"
if npm run build; then
    echo "✓ Build completed successfully"
else
    echo "✗ Build failed"
    exit 1
fi

# --------------------------------------------------------------------------- 
# Bundle step (for package preparation)
# ---------------------------------------------------------------------------
echo ""
echo "--- Step 3: Creating bundle ---"
if npm run bundle; then
    echo "✓ Bundle created successfully"
else
    echo "✗ Bundle creation failed"
    exit 1
fi

# ---------------------------------------------------------------------------
# Final verification - check dist directory exists and has content
# ---------------------------------------------------------------------------
echo ""
echo "--- Step 4: Verifying build output ---"
if [[ -d "dist" ]] && [[ -f "dist/cli.js" ]]; then
    dist_size=$(stat -c%s "dist/cli.js" 2>/dev/null || stat -f%z "dist/cli.js" 2>/dev/null || echo 0)
    if [[ "${dist_size}" -gt 10000 ]]; then
        echo "✓ Build output verified (dist/cli.js: $(( dist_size / 1024 )) KB)"
    else
        echo "✗ Build output too small"
        exit 1
    fi
else
    echo "✗ Build output not found in dist/"
    exit 1
fi

# Mark cleanup as done to suppress failure message
CLEANUP_DONE=true

npm run clean
rm -rf node_modules

echo ""
echo "==========================================="
echo " ✓ Build successful!"
echo "==========================================="
