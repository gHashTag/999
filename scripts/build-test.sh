#!/bin/bash
# Build and test script

# Exit immediately if a command exits with a non-zero status.
set -e

echo "🏗️ Building the project..."
pnpm run build

echo "🧪 Running tests..."
pnpm run test

echo "🎉 Build and tests completed successfully!" 