#!/bin/bash
# Сохраняет снимок ключевых конфигурационных файлов

TIMESTAMP=$(date +%Y%m%d%H%M%S)
SNAPSHOT_DIR="config-snapshots/snapshot-${TIMESTAMP}"

mkdir -p "${SNAPSHOT_DIR}"

# Список файлов для сохранения
FILES_TO_SAVE=(
  "package.json"
  "bun.lockb"
  "tsconfig.json"
  "vite.config.ts"
  ".npmrc"
  # Добавьте сюда другие важные файлы, например:
  # ".eslintrc.js"
  # ".prettierrc.js"
  # ".husky/pre-commit"
)

echo "💾 Сохранение снимка конфигурации в ${SNAPSHOT_DIR}..."

for file in "${FILES_TO_SAVE[@]}"; do
  if [ -f "$file" ]; then
    cp "$file" "${SNAPSHOT_DIR}/"
    echo "  - Скопирован: ${file}"
  else
    echo "  ⚠️ Файл не найден (пропущен): ${file}"
  fi
done

echo "✅ Снимок конфигурации сохранен." 