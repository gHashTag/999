import { HandlerStepName } from "@/types/handlerSteps"
import { runTerminalCommand } from "@/tools/runTerminalCommand"

/**
 * Runs tests on the provided code using bun test.
 * @param logger - Inngest logger instance
 * @param eventId - Unique event identifier
 * @param testFilePath - Path to the test file to run
 * @returns Result of the test run
 */
export const runVitest = async (
  logger: any,
  eventId: string,
  testFilePath: string
): Promise<{ success: boolean; errors: string[] | null }> => {
  logger.info("Running tests for generated code.", {
    step: HandlerStepName.NETWORK_RUN_START || "NETWORK_RUN_START",
    eventId,
  })

  // Запускаем тесты с помощью bun test
  const command = `bun test ${testFilePath}`
  logger.info(`Executing test command: ${command}`, {
    step: "TEST_COMMAND",
    eventId,
  })

  try {
    const result = await runTerminalCommand({ command, is_background: false })

    if (result.success && result.output) {
      // Проверяем, есть ли ошибки в выводе команды
      const errors = result.output.includes("fail")
        ? result.output
            .split("\n")
            .filter(
              (line: string) => line.includes("fail") || line.includes("error")
            )
        : null

      logger.info("Test run completed.", {
        step: HandlerStepName.NETWORK_RUN_SUCCESS || "NETWORK_RUN_SUCCESS",
        eventId,
        success: errors === null,
        errors: errors || "none",
      })

      return { success: errors === null, errors }
    } else {
      logger.error("Test command failed to execute.", {
        step: "TEST_FAILED",
        eventId,
        error: result.error || "Unknown error",
      })
      return {
        success: false,
        errors: ["Test command failed: " + (result.error || "Unknown error")],
      }
    }
  } catch (error) {
    logger.error("Unexpected error during test run.", {
      step: "TEST_UNEXPECTED_ERROR",
      eventId,
      error: error instanceof Error ? error.message : String(error),
    })
    return {
      success: false,
      errors: [
        "Unexpected error: " +
          (error instanceof Error ? error.message : String(error)),
      ],
    }
  }
}
