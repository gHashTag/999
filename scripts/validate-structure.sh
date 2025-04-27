#!/usr/bin/env bash
set -eo pipefail

# Санкционированные пути
# Расширенные правила священной структуры
# Обновленный список разрешенных путей
ALLOWED_PATHS=(
  ".cursor"
  "src"
  "scripts"
  "tests"
  "vendor-types"
  "artifacts"
  "dist"
  "node_modules"
  "html"
  "logs"
  "src/__tests__"
  "src/agents"
  "src/cli"
  "src/types"
  "src/inngest"
  "src/tools"
  "src/utils"
  "open-codex"
)

# Проверка каждой директории
find . -maxdepth 1 -type d ! -path './.*' ! -path '.' | while read -r dir; do
  dir=${dir#./}
  if ! printf "%s\n" "${ALLOWED_PATHS[@]}" | grep -qx "$dir"; then
    echo "🛑 Запрещенная директория: $dir"
    echo "Все новые пути должны быть добавлены в validate-structure.sh"
    exit 1
  fi
done

echo "✅ Структура соответствует священным канонам"