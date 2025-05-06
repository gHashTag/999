// import { Inngest } from "inngest"
// FIX: Remove unused EventPayload and StepOp import
// import { type EventPayload, type StepOp } from "inngest"

// Предполагаем, что клиент Inngest определен где-то еще (например, в src/inngest/client.ts или index.ts)
// Если нет, нужно будет создать базовый клиент здесь или импортировать существующий 'inngest' из index.ts
// Для простоты пока импортируем существующий
import { inngest } from "@/inngest/client"
import type { EventPayload, Context } from "inngest"

// Define a simple event type for the example
interface MinimalEvent extends EventPayload {
  name: "minimal.event.example"
  data: { message: string }
}

export const minimalExampleFunction = inngest.createFunction(
  { id: "minimal-example", name: "Minimal Example Function" },
  { event: "minimal.event.example" as const },
  async ({
    event,
    step,
    logger,
  }: {
    event: MinimalEvent
    step: Context["step"]
    logger: any
  }) => {
    logger.info("Minimal example function started!", { data: event.data })

    const result = await step.run("some-step", async () => {
      return `Received message: ${event.data.message}`
    })

    logger.info("Step result:", { result })
    return { success: true, message: result }
  }
)
