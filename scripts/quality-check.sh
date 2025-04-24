#!/bin/bash
# Code quality check script (linting and formatting)

# Exit immediately if a command exits with a non-zero status.
set -e

echo "🧐 Running code quality checks..."

echo "🎨 Checking formatting with Prettier..."
pnpm run format:check

echo "🧹 Checking linting with ESLint..."
pnpm run lint

echo "✅ Code quality checks passed!" 