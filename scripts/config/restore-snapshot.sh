#!/bin/bash
# Восстанавливает снимок конфигурации

# Скрипт для восстановления конфигурации из указанного снимка ("Иглы Кощея")

# Проверка наличия аргумента (имени директории снимка)
if [ -z "$1" ]; then
  echo "🚫 Ошибка: Укажите имя директории снимка в качестве аргумента."
  echo "Пример использования: bash scripts/config/restore-snapshot.sh snapshots/snapshot-YYYY-MM-DD_HH-MM-SS"
  exit 1
fi

SNAPSHOT_DIR=$1
PROJECT_ROOT=$(pwd) # Определяем корень проекта

# Проверка существования директории снимка
if [ ! -d "$SNAPSHOT_DIR" ]; then
  echo "🚫 Ошибка: Директория снимка '$SNAPSHOT_DIR' не найдена."
  exit 1
fi

echo "✨ Восстановление конфигурации из '$SNAPSHOT_DIR'..."

# Список критически важных конфигурационных файлов (синхронизирован с save-snapshot.sh)
CONFIG_FILES=(
  "package.json"
  "bun.lockb" # Заменили pnpm-lock.yaml
  "tsconfig.json"
  "vite.config.ts"
  ".npmrc" # Пока оставляем, хотя bun может его не использовать так же, как pnpm
  # Добавьте сюда другие важные файлы конфигурации при необходимости
)

# Перебор и восстановление файлов
RESTORED_COUNT=0
SKIPPED_COUNT=0
for file in "${CONFIG_FILES[@]}"; do
  SNAPSHOT_FILE_PATH="$SNAPSHOT_DIR/$file"
  DESTINATION_PATH="$PROJECT_ROOT/$file"

  if [ -f "$SNAPSHOT_FILE_PATH" ]; then
    echo "  ↪️ Восстанавливаю '$file' из '$SNAPSHOT_FILE_PATH' в '$DESTINATION_PATH'..."
    cp "$SNAPSHOT_FILE_PATH" "$DESTINATION_PATH"
    RESTORED_COUNT=$((RESTORED_COUNT + 1))
  else
    echo "  ⚠️ Файл '$file' не найден в снимке '$SNAPSHOT_DIR'. Пропускаю."
    SKIPPED_COUNT=$((SKIPPED_COUNT + 1))
  fi
done

echo ""
echo "✅ Восстановление завершено."
echo "   - Восстановлено файлов: $RESTORED_COUNT"
echo "   - Пропущено файлов (не найдены в снимке): $SKIPPED_COUNT"
echo "ℹ️ Не забудьте запустить 'bun install' для установки зависимостей согласно восстановленному 'package.json' и 'bun.lockb'." 