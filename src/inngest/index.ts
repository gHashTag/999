export * from "./logic/utils"

/* eslint-disable */
import "dotenv/config"

import { Inngest, type Context } from "inngest"
import { Sandbox } from "@e2b/code-interpreter"
// import { createDevOpsNetwork } from "@/network/network" // Закомментировано временно
// COMMENTED OUT: Temporarily unused state types
// import { TddNetworkState, NetworkStatus } from "@/types/network"
import { CodingAgentEvent, codingAgentEventSchema } from "@/types/events"
// import { AgentDependencies } from "@/types/agents" // Закомментировано временно
// import { getAllTools } from "@/tools/toolDefinitions" // Закомментировано временно
/* // Закомментировано временно
import {
  createTesterAgent,
  createCodingAgent,
  createCriticAgent,
} from "@/agents"
*/
import { log } from "@/utils"

// Initialize Inngest Client
export const inngest = new Inngest({ id: "agentkit-tdd-agent" })

// Define getSandbox function locally using step context if needed elsewhere, or keep encapsulated
// export const getSandbox = ... // If needed externally

// --- Main Handler --- //
// FIX: Accept the full context object and destructure inside
async function codingAgentHandler({
  event,
  step,
}: {
  event: CodingAgentEvent
  step: Context["step"]
}) {
  // Log the event and step objects to check if they are passed correctly
  log("info", "HANDLER_DEBUG_CONTEXT", "Handler invoked", {
    eventId: event?.id,
    isEventDefined: !!event,
    isStepDefined: !!step,
    stepKeys: step ? Object.keys(step) : null, // Log step keys if defined
  })

  if (!step) {
    log(
      "error",
      "STEP_UNDEFINED_DEBUG",
      "Step object is undefined inside handler!",
      { eventId: event?.id }
    )
    // Avoid throwing here during debug to see if the log appears
    return { error: "Step context was undefined." }
  }

  // Validate event data using the schema
  // FIX: Add back schema validation
  const validatedData = codingAgentEventSchema.safeParse(event.data)
  if (!validatedData.success) {
    log("error", "HANDLER_START", "Invalid event data.", {
      eventId: event?.id,
      isEventDefined: !!event,
      isStepDefined: !!step,
      stepKeys: step ? Object.keys(step) : null, // Log step keys if defined
    })
    return { error: "Invalid event data." }
  }

  try {
    const eventId = event.id
    if (!eventId) {
      throw new Error("Event ID is missing after validation.")
    }
    // const taskInput = validatedData.data.input // Закомментировано временно

    log("info", "GET_SANDBOX_ID_START", "Getting sandbox ID...", { eventId })
    const sandboxId = await step.run("get-sandbox-id", async () => {
      log("info", "CREATE_SANDBOX_STEP_START", "Creating sandbox...", {
        eventId,
      })
      const sandbox = await Sandbox.create()
      log("info", "CREATE_SANDBOX_STEP_END", "Sandbox created.", {
        eventId,
        newSandboxId: sandbox.sandboxId,
      })
      return sandbox.sandboxId
    })
    log("info", "GET_SANDBOX_ID_END", "Got sandbox ID.", { eventId, sandboxId })

    // TEMPORARY getSandboxForTools - needs fixing if tools need sandbox instance
    // const getSandboxForTools = async (): Promise<Sandbox | null> => {
    //   log("warn", "TEMP_HACK", "Providing null sandbox to tools", { eventId })
    //   return null // Provide null for now
    // }

    log("info", "CREATE_TOOLS_START", "Creating tools...", {
      eventId,
      sandboxId,
    })
    // const allTools = getAllTools(log, getSandboxForTools, eventId, sandboxId) // Закомментировано временно
    log("info", "CREATE_TOOLS_END", "Tools created.", { eventId, sandboxId })

    log("info", "CREATE_AGENTS_START", "Creating agents...", {
      eventId,
      sandboxId,
    })
    /* // Закомментировано временно
    const agentDeps: AgentDependencies = {
      allTools,
      log,
      apiKey: process.env.DEEPSEEK_API_KEY!,
      modelName: process.env.DEEPSEEK_MODEL || "deepseek-coder",
    }
    const testerAgent = createTesterAgent(agentDeps)
    const codingAgent = createCodingAgent(agentDeps)
    const criticAgent = createCriticAgent(agentDeps)
    */
    log("info", "CREATE_AGENTS_END", "Agents created.", { eventId, sandboxId })

    // ВРЕМЕННО КОММЕНТИРУЕМ СОЗДАНИЕ СЕТИ ДЛЯ ТЕСТА ЗАПУСКА СЕРВЕРА
    /*
    const devOpsNetwork = createDevOpsNetwork(
      testerAgent,
      codingAgent,
      criticAgent
    )
    */

    log("info", "NETWORK_RUN_START", "Running DevOps network step...", {
      eventId,
      sandboxId,
    })
    // ВРЕМЕННО КОММЕНТИРУЕМ ЗАПУСК СЕТИ
    /*
    const networkResult = await step.run("run-devops-network", async () => {
      try {
        log(
          "info",
          "NETWORK_RUN_INTERNAL_START",
          "Calling devOpsNetwork.run()...",
          { eventId, sandboxId }
        )
        const result = await devOpsNetwork.run(taskInput) // Pass taskInput
        log(
          "info",
          "NETWORK_RUN_INTERNAL_END",
          "DevOps network finished internally.",
          {
            eventId,
            sandboxId,
            internalResultStructure: result ? Object.keys(result) : null,
          }
        )
        return result
      } catch (networkError: any) {
        log(
          "error",
          "NETWORK_RUN_INTERNAL_ERROR",
          "Error occurred inside devOpsNetwork.run()",
          {
            eventId,
            sandboxId,
            error: networkError.message,
            stack: networkError.stack,
          }
        )
        // Re-throw the error to let step.run handle retries if configured
        throw networkError
      }
    })
    */
    const networkResult = { info: "Network run skipped for server start test" } // Placeholder
    log("info", "NETWORK_RUN_STEP_END", "DevOps network step skipped.", {
      eventId,
      sandboxId,
    })

    // --- Debug: Inspect networkResult structure --- //
    log("info", "DEBUG_NETWORK_RESULT", "Inspecting networkResult...", {
      eventId,
      networkResult: networkResult as any,
    })

    // --- Read Final State for Logging/Cleanup --- //
    const finalStateForLogging = networkResult as any // Cast to any for now

    // TODO: Restore state handling logic based on DEBUG_NETWORK_RESULT log

    // Return the final state obtained
    return { finalState: finalStateForLogging } // Return the result
  } catch (error: any) {
    log("error", "HANDLER_ERROR", "An error occurred in the main handler.", {
      eventId: event?.id, // Use optional chaining for safety
      // ... existing code ...
    })
    // Ensure catch block also returns something consistent if needed, or rethrows
    // For now, return an error structure
    return {
      error: `Handler failed: ${error instanceof Error ? error.message : String(error)}`,
    }
  } // End try-catch
}

// Define the function before exporting it.
export const codingAgentFunction = inngest.createFunction(
  { id: "coding-agent-tdd-function", name: "TDD Coding Agent Function" }, // Updated ID and Name
  { event: "coding-agent/run" },
  codingAgentHandler // Use the handler function defined above
)

// --- Minimal Fastify Server for E2E Test --- //
import Fastify from "fastify"
// Используем плагин для Fastify
import { fastifyPlugin } from "inngest/fastify"

const PORT = 8484 // Должен совпадать с APP_SERVER_URL в тесте

const fastify = Fastify({
  // Можно добавить logger: true для отладки Fastify, если нужно
  logger: false,
})

// Регистрируем плагин Inngest
fastify.register(fastifyPlugin, {
  client: inngest,
  functions: [codingAgentFunction],
  // Опции для плагина, если нужны (например, путь endpoint)
  options: {
    // serveHost, servePath, logLevel и т.д. можно указать здесь
    // По умолчанию будет /api/inngest
  },
})

// Базовый обработчик для GET /, чтобы waitForUrl мог проверить доступность
fastify.get("/", async (request, reply) => {
  return reply.send("OK")
})

// Запускаем Fastify сервер
const start = async () => {
  try {
    await fastify.listen({ port: PORT, host: "0.0.0.0" }) // Слушаем на всех интерфейсах
    log(
      "info",
      "FASTIFY_SERVER_START",
      `Minimal Fastify server listening on port ${PORT}`
    )
  } catch (err) {
    log("error", "FASTIFY_SERVER_ERROR", `Fastify server error: ${err}`)
    fastify.log.error(err) // Используем логгер Fastify
    process.exit(1)
  }
}
start()

// --- Utils related to Inngest ---
// We might keep the getSandbox util here or move it.
// Let's assume it's in ./logic/utils for now as originally intended.
// export { getSandbox } from "./logic/utils"; // Re-export if needed
