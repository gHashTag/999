import { exec } from "child_process"
import { promisify } from "util"
import { HandlerStepName } from "@/types/handlerSteps"
import { inngest } from "@/inngest/client"
import type { BaseLogger } from "@/types/agents"
// import type { Logger as InngestLogger } from "inngest"

const execAsync = promisify(exec)

/**
 * Базовая функция для выполнения проверки типов TypeScript.
 */
async function performActualTypeCheck(): Promise<{
  success: boolean
  errors: string | null
}> {
  try {
    // const { stdout, stderr } = await execAsync("bun exec tsc --noEmit") // stdout не используется
    const { stderr } = await execAsync("bun exec tsc --noEmit")
    if (stderr && stderr.trim() !== "") {
      // Если stderr не пустой, считаем это ошибкой
      return { success: false, errors: stderr }
    }
    // Если stderr пустой, считаем, что ошибок нет (stdout может содержать что-то нерелевантное)
    return { success: true, errors: null }
  } catch (error: any) {
    // Если сама команда execAsync выбросила исключение (например, tsc не найден)
    // или если tsc завершился с ненулевым кодом, это попадет сюда.
    // stderr из объекта ошибки часто содержит вывод ошибок компилятора.
    const errorMessage =
      error.stderr || error.message || "Неизвестная ошибка при проверке типов."
    return {
      success: false,
      errors: errorMessage,
    }
  }
}

// Определяем интерфейс для данных события этой Inngest-функции
export interface RunTypeCheckEventData {
  code_to_check?: string // Пока не используется, но может понадобиться для более гранулярной проверки
  eventId?: string
  // Другие необходимые данные
}

// Создаем Inngest-функцию
export const runTypeCheckFunction = inngest.createFunction(
  { id: "run-type-check-function", name: "Run TypeScript Type Check" },
  { event: "typecheck/run-requested" }, // Пример имени события
  async ({
    event,
    logger,
  }: {
    event: { data: RunTypeCheckEventData }
    logger: BaseLogger
  }) => {
    // step не используется
    logger.info("Inngest function runTypeCheckFunction invoked.", {
      eventId: event.data.eventId,
      step: HandlerStepName.TYPE_CHECK_START,
    })

    const result = await performActualTypeCheck()

    logger.info("Type check performed.", {
      eventId: event.data.eventId,
      success: result.success,
      hasErrors: !!result.errors,
      step: HandlerStepName.TYPE_CHECK_END,
    })

    if (!result.success) {
      logger.error("Type check failed.", {
        eventId: event.data.eventId,
        errors: result.errors,
      })
    }

    return result // Возвращаем { success: boolean, errors: string | null }
  }
)

// Оставляем старые функции, если они где-то используются, но для invoke нужна runTypeCheckFunction
export { performActualTypeCheck as runTypeCheck }

/**
 * Runs type checking on the provided code.
 * @param logger - Inngest logger instance
 * @param eventId - Unique event identifier
 * @returns Result of the type check
 */
export const runTypeCheckForGeneratedCode = async (
  logger: any,
  eventId: string
): Promise<{ success: boolean; errors: string[] | null }> => {
  logger.info(
    "[runTypeCheckForGeneratedCode] Running type check for generated code.",
    { eventId }
  )
  const simpleCheckResult = await performActualTypeCheck()
  return {
    success: simpleCheckResult.success,
    errors: simpleCheckResult.errors
      ? simpleCheckResult.errors.split("\n")
      : null,
  }
}
