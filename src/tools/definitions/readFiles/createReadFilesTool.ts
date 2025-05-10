import { createTool, type ToolHandlerOpts } from "@inngest/agent-kit"
import { z } from "zod"
import type { DevOpsNetwork } from "@/network/network" // Добавляем импорт типа сети
// import type { Step } from "inngest/components/InngestFunction" // Временно уберем, так как context будет any

const simpleDiagnosticSchema = z.object({ temp: z.string().optional() })

export const someTool = createTool({
  name: "someTool",
  description: "Some tool.",
  parameters: simpleDiagnosticSchema,
  handler: async (
    params: any, // Максимально упрощаем тип параметров
    context: ToolHandlerOpts<DevOpsNetwork> // Явно типизируем context
  ) => {
    console.log("someTool handler called with params (type any):", params)
    // console.log("someTool handler called with context (typed):", context) // Можем закомментировать, чтобы не выводить весь объект

    // Используем context.logger напрямую
    context.logger.info("Лог из someTool (context.logger)", { params })

    // Пример доступа к другим свойствам context, если нужно:
    // const networkState = await context.network.get("status") // Пример чтения состояния
    // context.logger.info(\`Текущий статус сети: \${networkState}\`)

    // Попытка использовать step и logger будет без типобезопасности
    // if (context && context.step && context.step.logger) { // Этот блок больше не нужен или должен быть пересмотрен
    //   context.step.logger.info(
    //     "Лог из someTool (context.step.logger существует)",
    //     { params }
    //   )
    // } else {
    //   console.log(
    //     "context.step или context.step.logger отсутствуют или context не определен."
    //   )
    // }
    return { success: true, paramsReceived: String(params) } // Преобразуем params в строку для безопасности
  },
})

// Файл временно пуст для диагностики
