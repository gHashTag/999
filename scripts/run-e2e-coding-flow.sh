#!/bin/bash
# Запускает E2E тест coding-agent-flow.e2e.test.ts и выводит JSON-результат

TEST_FILE="src/__tests__/e2e/coding-agent-flow.e2e.test.ts"
REPORTER="json"
OUTPUT_FILE="test-results.json"

echo "🚀 Running E2E test: ${TEST_FILE}"
echo "📂 Using output file: ${OUTPUT_FILE}"

# Run Vitest with specific parameters
echo "🏃 Running Vitest E2E test..."
# pnpm exec bun:test run ${TEST_FILE} --no-watch --reporter=${REPORTER} --outputFile=${OUTPUT_FILE}
bunx bun:test run ${TEST_FILE} --no-watch --reporter=${REPORTER} --outputFile=${OUTPUT_FILE}

EXIT_CODE=$?

echo "📊 Vitest finished with exit code: ${EXIT_CODE}"

# Выводим результат из JSON-файла, если он существует
if [ -f "${OUTPUT_FILE}" ]; then
  echo "📄 Test results (${OUTPUT_FILE}):"
  cat "${OUTPUT_FILE}"
  # Опционально: можно удалить файл после вывода
  # rm "${OUTPUT_FILE}"
else
  echo "⚠️ JSON output file (${OUTPUT_FILE}) not found."
fi

# Завершаем скрипт с кодом выхода Vitest
exit ${EXIT_CODE} 