import { HandlerStepName } from "@/types/handlerSteps"
import { inngest } from "@/inngest/client"
import type { BaseLogger } from "@/types/agents"
import { promisify } from "util"
import { exec } from "child_process"

const execAsync = promisify(exec)

/**
 * Базовая функция для выполнения тестов Vitest/Bun.
 */
async function performActualVitestRun(
  testFilePath: string | undefined,
  logger: BaseLogger,
  eventId?: string
): Promise<{
  success: boolean
  summary: string | null
  errors: string[] | null
}> {
  if (!testFilePath) {
    logger.warn("Test file path not provided for Vitest run. Skipping tests.", {
      eventId,
    })
    return {
      success: true,
      summary: "No test file path provided, tests skipped.",
      errors: null,
    } // Считаем успехом, так как нечего запускать
  }

  const command = `bun test ${testFilePath}`
  logger.info(`Executing test command: ${command}`, {
    step: "VITEST_RUN_COMMAND",
    eventId,
  })

  try {
    const { stdout, stderr } = await execAsync(command)
    // Bun test обычно выводит результаты в stdout. Ошибки выполнения самой команды или серьезные ошибки vitest могут быть в stderr.
    // Успешное выполнение тестов не гарантирует отсутствие stderr (например, предупреждения).
    // Неуспешное выполнение тестов (проваленные тесты) завершает команду с ненулевым кодом, что попадает в catch.

    // Если команда выполнилась (не упала в catch), но есть stderr, логируем его.
    if (stderr && stderr.trim() !== "") {
      logger.warn(
        "Vitest run produced stderr output (but command succeeded):",
        { eventId, stderr }
      )
    }

    // Анализируем stdout на предмет падений (bun test пишет PASS/FAIL)
    // Это очень упрощенный анализ. В идеале нужен json reporter.
    const output = stdout.toLowerCase()
    const failedCountMatch = output.match(/(\d+) failed/)
    const passedCountMatch = output.match(/(\d+) passed/)

    let success = true
    let summary = stdout // По умолчанию весь stdout как summary
    let errors: string[] | null = null

    if (failedCountMatch && parseInt(failedCountMatch[1], 10) > 0) {
      success = false
      summary = `Tests failed. Output:\n${stdout}`
      // Попробуем извлечь строки с ошибками, если это возможно (очень грубо)
      errors = stdout
        .split("\n")
        .filter(
          line =>
            line.toLowerCase().includes("fail") ||
            line.toLowerCase().includes("error")
        )
    } else if (passedCountMatch && parseInt(passedCountMatch[1], 10) > 0) {
      summary = `Tests passed. Output:\n${stdout}`
    } else if (output.includes("no tests found")) {
      summary = "No tests found."
      // success остается true, так как нет упавших тестов
    }

    return { success, summary, errors }
  } catch (error: any) {
    // Сюда попадаем, если `bun test` завершился с ошибкой (ненулевой exit code), что обычно означает проваленные тесты
    logger.warn(
      "Vitest command execution failed (likely due to test failures).",
      { eventId, error }
    )
    const errorOutput =
      error.stdout ||
      error.stderr ||
      error.message ||
      "Неизвестная ошибка при запуске тестов."
    return {
      success: false,
      summary: `Test execution failed: ${errorOutput}`,
      errors: errorOutput.split("\n"), // Весь вывод ошибки как массив строк
    }
  }
}

// Определяем интерфейс для данных события этой Inngest-функции
export interface RunVitestEventData {
  test_file_path?: string
  implementation_file_path?: string // Может быть полезно для контекста, но не используется напрямую в performActualVitestRun
  eventId?: string
}

// Создаем Inngest-функцию
export const runVitestFunction = inngest.createFunction(
  { id: "run-vitest-function", name: "Run Vitest/Bun Tests" },
  { event: "vitest/run-requested" }, // Пример имени события
  async ({
    event,
    logger,
  }: {
    event: { data: RunVitestEventData }
    logger: BaseLogger
  }) => {
    logger.info("Inngest function runVitestFunction invoked.", {
      eventId: event.data.eventId,
      testFilePath: event.data.test_file_path,
      step: HandlerStepName.VITEST_RUN_START,
    })

    const result = await performActualVitestRun(
      event.data.test_file_path,
      logger,
      event.data.eventId
    )

    logger.info("Vitest run performed.", {
      eventId: event.data.eventId,
      success: result.success,
      summary: result.summary,
      step: HandlerStepName.VITEST_RUN_END,
    })

    if (!result.success) {
      logger.warn("Vitest tests failed or execution error.", {
        eventId: event.data.eventId,
        summary: result.summary,
        errors: result.errors,
      })
    }
    return result // Возвращаем { success: boolean, summary: string | null, errors: string[] | null }
  }
)

// Оставляем старую функцию, если она где-то используется, но для invoke нужна runVitestFunction
export { performActualVitestRun as runVitest }
