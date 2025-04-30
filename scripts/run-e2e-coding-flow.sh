#!/bin/bash
# Запускает E2E тест coding-agent-flow.e2e.test.ts и выводит JSON-результат

# Exit immediately if a command exits with a non-zero status.
set -eo pipefail

# --- Configuration ---
TEST_FILE="src/__tests__/e2e/teamLeadAgent.e2e.test.ts"
# TEST_FILE="src/__tests__/e2e/coding-agent-flow.e2e.test.ts" # Example of another test
REPORTER="json"
OUTPUT_FILE="test-results.json"

# --- Main Script ---
echo "🚀 Starting E2E Test Workflow for ${TEST_FILE}..."

echo "📂 Using output file: ${OUTPUT_FILE}"

# Run Bun test with specific parameters
echo "🏃 Running Bun E2E test..."
# Set environment variable for E2E context
VITEST_E2E=true \
  bun test --isolate --bail "${TEST_FILE}"

EXIT_CODE=$?
echo "📊 Bun test finished with exit code: ${EXIT_CODE}"

# Analyze logs (example)
# echo "📄 Analyzing node-app.log..."
# grep -i "error\|warn" node-app.log || echo "  -> No errors or warnings found."

# Check exit code
if [ ${EXIT_CODE} -ne 0 ]; then
  echo "❌ E2E test failed."
  exit ${EXIT_CODE}
else
  echo "✅ E2E test passed successfully!"
fi

# Выводим результат из JSON-файла, если он существует
if [ -f "${OUTPUT_FILE}" ]; then
  echo "📄 Test results (${OUTPUT_FILE}):"
  cat "${OUTPUT_FILE}"
  # Опционально: можно удалить файл после вывода
  # rm "${OUTPUT_FILE}"
else
  echo "⚠️ JSON output file (${OUTPUT_FILE}) not found."
fi

# Завершаем скрипт с кодом выхода Bun теста
exit ${EXIT_CODE} 