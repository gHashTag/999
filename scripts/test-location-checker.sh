#!/bin/bash
# Скрипт проверяет, что все тесты находятся только в разрешенной папке __tests__

ALLOWED_TEST_DIR="src/__tests__"
FOUND_OTHER_TESTS=$(find . -name "*.test.*" -not -path "./$ALLOWED_TEST_DIR/*" -not -path "./node_modules/*")

if [ -n "$FOUND_OTHER_TESTS" ]; then
    echo "❌ Найдены тесты вне разрешенной папки $ALLOWED_TEST_DIR:"
    echo "$FOUND_OTHER_TESTS"
    echo "Правило: Все тесты должны находиться только в $ALLOWED_TEST_DIR"
    exit 1
fi

echo "✅ Все тесты находятся в разрешенной папке $ALLOWED_TEST_DIR"