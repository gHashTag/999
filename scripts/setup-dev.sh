#!/bin/bash
# Development environment setup script

# Exit immediately if a command exits with a non-zero status.
set -e

echo "🔧 Setting up development environment..."

echo "📦 Installing dependencies with bun..."
bun install

echo "🎣 Preparing Husky hooks..."
# Usually bun install runs the prepare script, but run it explicitly just in case.
bun run prepare

echo "✨ Development environment setup complete!" 