#!/bin/bash

# Проверка расположения type-файлов
check_type_locations() {
  local invalid_files
  invalid_files=$(find src -name '*.d.ts' -o -name '*type*.ts' -not -path 'src/types/*' -not -path './vendor-types/*')

  if [ -n "$invalid_files" ]; then
    echo -e "\n\033[31m█████████████████████████████████████████████████████████████████"
    echo "⚠️  Нарушение порядка типов!"
    echo "   Все type-файлы должны находиться в src/types"
    echo "█████████████████████████████████████████████████████████████████\033[0m"
    echo "Обнаружены файлы:\n$invalid_files"
    exit 1
  fi
}

check_type_locations