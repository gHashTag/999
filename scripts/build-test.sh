#!/bin/bash
# Строгая проверка ошибок
set -eo pipefail

echo "🔍 Проверка расположения тестов..."
./test-location-checker.sh

echo "🏗️ Building project..."
# Запускаем сборку
bun run build

echo "🧪 Running tests..."
# Запускаем тесты с помощью Vitest
# VITEST_E2E=true pnpm run test
VITEST_E2E=true bun run test

echo "✅ Build and test complete."