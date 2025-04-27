#!/bin/bash
# Строгая проверка ошибок
set -eo pipefail

# Добавлена проверка расположения type-файлов
echo "🔄 Запуск проверки типов..."
pnpm exec tsc --noEmit

echo "🔍 Проверка структуры проекта..."
./validate-structure.sh

echo "🔍 Проверка расположения type-файлов..."
./type-location-checker.sh

echo "✅ Все проверки завершены успешно"

# echo "🔍 Проверка расположения тестов..."
./test-location-checker.sh

echo "🏗️ Building project..."
# Запускаем сборку
bun run build

echo "🧪 Running tests..."
# Запускаем тесты с помощью Vitest
# VITEST_E2E=true pnpm run test
VITEST_E2E=true bun run test

echo "✅ Build and test complete."