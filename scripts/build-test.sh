#!/bin/bash
# Exit immediately if a command exits with a non-zero status.
set -e

# --- Configuration ---
# Add paths to ignore during build/test if needed
# IGNORE_PATHS=("src/ignore-this-dir" "src/some-other-file.ts")

# --- Functions ---
echo_blue() {
  echo -e "\033[0;34m$1\033[0m"
}

echo_green() {
  echo -e "\033[0;32m$1\033[0m"
}

echo_red() {
  echo -e "\033[0;31m$1\033[0m"
}

# --- Main Script ---
echo_blue "🚀 Starting Build & Test Script..."

# 1. Build the project
echo_blue "🏗️ Building project with TypeScript..."
pnpm run build
echo_green "✅ Build completed successfully."

# 2. Run Tests
echo_blue "🧪 Running tests with Bun..."
# Ensure environment variable is set if needed for specific tests
VITEST_E2E=true bun run test # Keep this line for now
# bun run test # Simpler version if VITEST_E2E is irrelevant
echo_green "✅ Tests completed successfully."

echo_green "🎉 Build & Test script finished successfully!"