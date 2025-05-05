import { HandlerStepName } from "@/types/handlerSteps"
import { runTerminalCommand } from "@/tools/runTerminalCommand"
// import type { Logger as InngestLogger } from "inngest"

/**
 * Runs type checking on the provided code.
 * @param logger - Inngest logger instance
 * @param eventId - Unique event identifier
 * @param codeToCheck - The code to type check
 * @returns Result of the type check
 */
export const runTypeCheck = async (
  logger: any,
  eventId: string,
  codeToCheck: string
): Promise<{ success: boolean; errors: string[] | null }> => {
  logger.info("Running type check for generated code.", {
    step: HandlerStepName.NETWORK_RUN_START || "NETWORK_RUN_START",
    eventId,
  })

  // Запускаем проверку типов с помощью TypeScript компилятора
  const command = "bun exec tsc --noEmit"
  logger.info(`Executing type check command: ${command}`, {
    step: "TYPE_CHECK_COMMAND",
    eventId,
  })

  try {
    const result = await runTerminalCommand({ command, is_background: false })

    if (result.success && result.output) {
      // Проверяем, есть ли ошибки в выводе команды
      const errors = result.output.includes("error")
        ? result.output
            .split("\n")
            .filter((line: string) => line.includes("error"))
        : null

      logger.info("Type check completed.", {
        step: HandlerStepName.NETWORK_RUN_SUCCESS || "NETWORK_RUN_SUCCESS",
        eventId,
        success: errors === null,
        errors: errors || "none",
      })

      return { success: errors === null, errors }
    } else {
      logger.error("Type check command failed to execute.", {
        step: "TYPE_CHECK_FAILED",
        eventId,
        error: result.error || "Unknown error",
      })
      return {
        success: false,
        errors: [
          "Type check command failed: " + (result.error || "Unknown error"),
        ],
      }
    }
  } catch (error) {
    logger.error("Unexpected error during type check.", {
      step: "TYPE_CHECK_UNEXPECTED_ERROR",
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
