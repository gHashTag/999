// import { Inngest } from "inngest"
// FIX: Remove unused EventPayload and StepOp import
// import { type EventPayload, type StepOp } from "inngest"

// Предполагаем, что клиент Inngest определен где-то еще (например, в src/inngest/client.ts или index.ts)
// Если нет, нужно будет создать базовый клиент здесь или импортировать существующий 'inngest' из index.ts
// Для простоты пока импортируем существующий
import { inngest } from "./index"

export const minimalFunction = inngest.createFunction(
  { id: "minimal-function", name: "Minimal Function" },
  { event: "test/minimal.event" },
  async ({ event, step, logger }) => {
    logger.info("Minimal function started", { data: event.data })

    const inputMessage = event.data?.message ?? "default message"

    // Выполняем простой шаг
    const result = await step.run("simple-step", async () => {
      logger.info("Running simple-step")
      // Простая обработка
      const processedMessage = `Processed: ${inputMessage}`
      logger.info("Finished simple-step", { processedMessage })
      return processedMessage
    })

    logger.info("Minimal function finished", { result })
    return { success: true, finalMessage: result }
  }
)
