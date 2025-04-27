#!/bin/bash

# Тестирует базовую установку и запуск ключевых скриптов

echo "🧪 Testing installation..."
bun install

# Список ключевых команд для проверки
COMMANDS=(
  "build"
  "lint"
  "format:check"
  "test"
)

for cmd in "${COMMANDS[@]}"; do
  echo "------------------------------------"
  echo "🔍 Testing command: bun run $cmd"
  bun run $cmd
  if [ $? -ne 0 ]; then
    echo "❌ Error running command: bun run $cmd"
    exit 1
  fi
done

echo "✅ Installation and basic commands test passed."