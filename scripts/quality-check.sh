#!/bin/bash
# Code quality check script (linting and formatting)

# Exit immediately if a command exits with a non-zero status.
set -e

echo "🧐 Running code quality checks..."

echo "💅 Checking formatting with Prettier..."
bun run format:check

# Добавляем проверку структуры перед линтингом
bash scripts/validate-structure.sh

echo "🧐 Linting with ESLint..."
bun run lint

echo "✅ Code quality checks passed!"