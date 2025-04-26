export * from "./logic/utils"

/* eslint-disable */
import "dotenv/config"

import { Inngest, type Context, type EventPayload } from "inngest"
import { Sandbox } from "@e2b/code-interpreter"
import { createDevOpsNetwork } from "@/network/network" // Раскомментировано
// COMMENTED OUT: Temporarily unused state types -> Удален импорт TddNetworkState
import { CodingAgentEvent, codingAgentEventSchema } from "@/types/events"
import { AgentDependencies } from "@/types/agents" // Раскомментировано
import { getAllTools } from "@/tools/toolDefinitions" // Раскомментировано
// Раскомментировано
import {
  createTesterAgent,
  createCodingAgent,
  createCriticAgent,
  createTeamLeadAgent,
} from "@/agents"
import { log } from "@/utils/logic/logger"
import { getSandbox } from "./logic/utils" // Добавлен импорт
// Import state types for handler logic
import { TddNetworkState, NetworkStatus } from "@/types/network"
import { Agent } from "@inngest/agent-kit"

// Initialize Inngest Client
export const inngest = new Inngest({ id: "agentkit-tdd-agent" })

// --- Проверяем загрузку ключа ---
log("info", "ENV_CHECK", "Checking INNGEST_SIGNING_KEY", {
  signingKey: process.env.INNGEST_SIGNING_KEY ? "Loaded" : "MISSING",
  // Не логируем сам ключ из соображений безопасности, только факт его наличия
})

// Define getSandbox function locally using step context if needed elsewhere, or keep encapsulated
// export const getSandbox = ... // If needed externally

// --- Main Handler --- //
// FIX: Accept the full context object and destructure inside
async function codingAgentHandler({
  event,
  step,
  agents,
}: {
  event: EventPayload<CodingAgentEvent>
  step: Context["step"]
  agents: {
    teamLeadAgent: Agent<any>
    testerAgent: Agent<any>
    codingAgent: Agent<any>
    criticAgent: Agent<any>
  }
}) {
  log("info", "HANDLER_ENTERED", "Handler invoked for a step.", {
    eventId: event?.id,
    incomingStatus: (event.data as any)?.currentState?.status,
  })

  if (!step) {
    log("error", "STEP_UNDEFINED", "Step context is undefined!", {
      eventId: event?.id,
    })
    return { error: "Step context was undefined." }
  }

  const validatedData = codingAgentEventSchema.safeParse(event.data)
  if (!validatedData.success) {
    log("error", "HANDLER_INVALID_DATA", "Invalid event data received.", {
      eventId: event?.id,
      validationErrors: validatedData.error.issues,
    })
    return { error: "Invalid event data." }
  }

  // Get current state or initialize
  // Explicitly cast currentState after validation
  let currentState = validatedData.data.currentState as
    | TddNetworkState
    | undefined
  const taskInput = validatedData.data.input // Always present
  const eventId = event.id
  if (!eventId) {
    throw new Error("Event ID is missing after validation.")
  }

  try {
    // sandboxId can be string or null in the state, but we handle creation if it's falsy (null or undefined)
    let currentSandboxId: string | null | undefined = currentState?.sandboxId

    // Create sandbox only if it doesn't exist (first run or null in state)
    if (!currentSandboxId) {
      log(
        "info",
        "GET_SANDBOX_ID_START",
        "No sandbox ID in state, creating new.",
        { eventId }
      )
      // Sandbox.create() returns string, so the type becomes string here
      const newSandboxId = await step.run("get-sandbox-id", async () => {
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
      currentSandboxId = newSandboxId // Assign the new string ID
      log("info", "GET_SANDBOX_ID_END", "Got new sandbox ID.", {
        eventId,
        sandboxId: currentSandboxId,
      })
    } else {
      log(
        "info",
        "GET_SANDBOX_ID_SKIP",
        "Reusing existing sandbox ID from state.",
        { eventId, sandboxId: currentSandboxId }
      )
    }

    // Initialize state if it's the first run
    if (!currentState) {
      if (!currentSandboxId) {
        // This should not happen if the logic above is correct, but for type safety
        throw new Error("Sandbox ID is missing after creation attempt.")
      }
      currentState = {
        task: taskInput, // taskInput is definitely a string
        status: NetworkStatus.Enum.NEEDS_TEST, // Initial status
        sandboxId: currentSandboxId, // Assign the created string ID
        // Other fields will be added by agents
      }
      log("info", "STATE_INITIALIZED", "Initialized new state.", {
        eventId,
        sandboxId: currentSandboxId,
      })
    } else {
      if (!currentSandboxId) {
        // This should not happen if the logic above is correct
        throw new Error("Sandbox ID is missing for existing state.")
      }
      // Ensure the current sandbox ID is in the state for subsequent runs
      currentState.sandboxId = currentSandboxId
      log("info", "STATE_REUSED", "Reusing existing state.", {
        eventId,
        sandboxId: currentSandboxId,
        status: currentState.status,
      })
    }

    // At this point, currentState and currentSandboxId (as string) must be defined
    if (!currentState || !currentSandboxId) {
      throw new Error(
        "Critical state or sandbox ID missing before tool creation."
      )
    }

    log("info", "CREATE_TOOLS_START", "Creating tools...", {
      eventId,
      sandboxId: currentSandboxId,
    })
    const allTools = getAllTools(
      log,
      getSandbox as (sandboxId: string | null) => Promise<Sandbox | null>,
      eventId,
      currentSandboxId
    )
    log("info", "CREATE_TOOLS_END", "Tools created.", {
      eventId,
      sandboxId: currentSandboxId,
    })

    log("info", "CREATE_AGENTS_START", "Creating agents...", {
      eventId,
      sandboxId: currentSandboxId,
    })
    const agentDeps: AgentDependencies = {
      allTools,
      log,
      apiKey: process.env.DEEPSEEK_API_KEY!,
      modelName: process.env.DEEPSEEK_MODEL || "deepseek-coder",
    }
    const teamLeadAgent = createTeamLeadAgent(agentDeps)
    const testerAgent = createTesterAgent(agentDeps)
    const codingAgent = createCodingAgent(agentDeps)
    const criticAgent = createCriticAgent(agentDeps)
    log("info", "CREATE_AGENTS_END", "Agents created.", {
      eventId,
      sandboxId: currentSandboxId,
    })

    const devOpsNetwork = createDevOpsNetwork(
      teamLeadAgent,
      testerAgent,
      codingAgent,
      criticAgent
    )

    // Restore state into the network for this run
    log(
      "info",
      "STATE_RESTORE_NETWORK",
      "Restoring current state into network.",
      {
        eventId,
        sandboxId: currentSandboxId, // Guaranteed string now
        status: currentState.status, // Guaranteed TddNetworkState now
      }
    )
    devOpsNetwork.state.kv.set("network_state", currentState)

    log("info", "NETWORK_RUN_START", "Running DevOps network step...", {
      eventId,
      sandboxId: currentSandboxId,
      currentStatus: currentState.status, // Guaranteed TddNetworkState now
    })

    let networkResult: any // Declare networkResult
    try {
      // Run the network - it will execute based on the restored state
      const result = await devOpsNetwork.run(currentState.task) // Guaranteed TddNetworkState now
      networkResult = result // Assign the result
      log("info", "NETWORK_RUN_INTERNAL_END", "DevOps network step finished.", {
        eventId,
        sandboxId: currentSandboxId,
        internalResultStructure: result ? Object.keys(result) : null,
      })
    } catch (networkError: any) {
      log(
        "error",
        "NETWORK_RUN_INTERNAL_ERROR",
        "Error occurred inside devOpsNetwork.run()",
        {
          eventId,
          sandboxId: currentSandboxId,
          error: networkError.message,
          stack: networkError.stack,
        }
      )
      // Potentially decide if the error is recoverable or should stop the process
      // For now, we rethrow to let the handler catch it.
      throw networkError
    }

    log(
      "info",
      "NETWORK_RUN_END",
      "DevOps network run finished for this step.",
      {
        eventId,
        sandboxId: currentSandboxId,
      }
    )

    // Get the state *after* the network run from the result
    let stateAfterRun = networkResult?.state?.kv?.get("network_state") as
      | TddNetworkState
      | undefined

    if (!stateAfterRun) {
      log(
        "error",
        "STATE_AFTER_RUN_MISSING",
        "State object is missing in the network result after run.",
        { eventId, sandboxId: currentSandboxId }
      )
      throw new Error("State missing after network run.")
    }

    log(
      "info",
      "STATE_AFTER_RUN_RETRIEVED",
      "Retrieved state after network run.",
      {
        eventId,
        sandboxId: currentSandboxId,
        status: stateAfterRun.status,
        generatedCommand: stateAfterRun.generated_command, // Log the command if present
      }
    )

    // --- Execute Open-Codex Command if Needed ---
    if (
      stateAfterRun.status === NetworkStatus.Enum.NEEDS_TEST_CRITIQUE && // Using this status temporarily as per agent definition
      stateAfterRun.generated_command
    ) {
      const commandToExecute = stateAfterRun.generated_command
      log(
        "info",
        "COMMAND_EXECUTION_START",
        "Executing generated open-codex command...",
        {
          eventId,
          sandboxId: currentSandboxId,
          command: commandToExecute,
        }
      )

      // Execute the command using run_terminal_cmd via step.run
      // NOTE: This uses the USER's terminal, not the E2B sandbox.
      const commandOutput = await step.run("execute-open-codex", async () => {
        // Here, we'd ideally use a tool like run_terminal_cmd if available
        // For simulation/placeholder, we log the intent.
        // In a real scenario with the tool: await tools.runTerminalCmd(commandToExecute)
        log(
          "warn", // Log as warn since it's not actually running in this context
          "COMMAND_EXECUTION_SIMULATED",
          "Simulating terminal command execution (needs run_terminal_cmd tool).",
          {
            eventId,
            command: commandToExecute,
          }
        )
        // Simulate successful execution for now
        return `Simulated output for: ${commandToExecute}`
      })

      log(
        "info",
        "COMMAND_EXECUTION_END",
        "Finished executing open-codex command.",
        {
          eventId,
          sandboxId: currentSandboxId,
          output: commandOutput, // Log the output (simulated for now)
        }
      )

      // Update state after command execution
      stateAfterRun.status = NetworkStatus.Enum.NEEDS_COMMAND_VERIFICATION // Set state for Critic/Verifier
      stateAfterRun.last_command_output = commandOutput as string // Store output
      // Clear the command now that it's executed?
      // stateAfterRun.generated_command = undefined;

      log(
        "info",
        "STATE_AFTER_COMMAND_EXEC",
        "Updated state after command execution.",
        {
          eventId,
          sandboxId: currentSandboxId,
          newStatus: stateAfterRun.status,
        }
      )
    }

    // Check for completion
    const nextStatus = stateAfterRun.status
    // Corrected: Use NetworkStatus enum for comparison
    const isCompleted =
      nextStatus === NetworkStatus.Enum.COMPLETED ||
      nextStatus === NetworkStatus.Enum.FAILED

    log("info", "STEP_CONCLUSION", "Processing step conclusion.", {
      eventId,
      sandboxId: currentSandboxId,
      finalStatus: nextStatus,
      isCompleted,
    })

    if (isCompleted) {
      log(
        "info",
        "WORKFLOW_COMPLETED",
        "TDD workflow completed successfully.",
        {
          eventId,
          sandboxId: currentSandboxId,
          finalState: stateAfterRun,
        }
      )
      // Optionally close the sandbox here if it's the final step
      // await step.run('close-sandbox', async () => {
      //   if (currentSandboxId) {
      //     const sandbox = await Sandbox.reconnect(currentSandboxId);
      //     await sandbox.close();
      //     log('info', 'SANDBOX_CLOSED', 'Closed sandbox on completion.', { eventId, sandboxId });
      //   }
      // });
      return { message: "Workflow completed", finalState: stateAfterRun }
    } else {
      // If not completed, invoke the next step with the updated state
      log(
        "info",
        "INVOKE_NEXT_STEP",
        "Workflow not completed, invoking next step.",
        {
          eventId,
          sandboxId: currentSandboxId,
          nextStatus,
        }
      )
      // FIX: Use function and correct data structure for invoke
      await step.invoke("trigger-next-agent-step", {
        function: codingAgentFunction, // Use the function reference directly
        data: {
          // Pass data directly
          input: taskInput,
          currentState: stateAfterRun, // Pass the updated state
        },
        // Можно добавить другие опции invoke, если нужны, например timeout
      })
      log("info", "NEXT_STEP_INVOKED", "Next step invocation sent.", {
        eventId,
        sandboxId: currentSandboxId,
      })
      return { message: `Step processed, invoking next. Status: ${nextStatus}` }
    }
  } catch (error: any) {
    log("error", "HANDLER_ERROR", "An error occurred in the main handler.", {
      eventId: event?.id,
      error: error.message,
      stack: error.stack,
    })
    // Optionally try cleanup here? Be careful with step context in catch blocks.
    return {
      error: `Handler failed: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

// Define the function before exporting it.
export const codingAgentFunction = inngest.createFunction(
  { id: "coding-agent-tdd-function", name: "TDD Coding Agent Function" },
  { event: "coding-agent/run" },
  async ({ event, step }) => {
    const currentEventId = event.id
    if (!currentEventId) {
      log(
        "error",
        "FUNCTION_NO_EVENT_ID",
        "Event ID missing in function trigger.",
        { eventName: event.name }
      )
      throw new Error("Event ID missing in function trigger.")
    }
    const agentDeps: AgentDependencies = {
      allTools: getAllTools(
        log,
        getSandbox as (sandboxId: string | null) => Promise<Sandbox | null>,
        currentEventId,
        null
      ),
      log: log,
      apiKey: process.env.DEEPSEEK_API_KEY!,
      modelName: process.env.DEEPSEEK_MODEL || "deepseek-coder",
    }
    const teamLeadAgent = createTeamLeadAgent(agentDeps)
    const testerAgent = createTesterAgent(agentDeps)
    const codingAgent = createCodingAgent(agentDeps)
    const criticAgent = createCriticAgent(agentDeps)

    // Call the separated handler logic
    return await codingAgentHandler({
      event: event, // Pass the full event payload
      step,
      // Pass all created agents
      agents: { teamLeadAgent, testerAgent, codingAgent, criticAgent },
    })
  }
)

// --- Minimal Test Function for Debugging --- (Удалено)
/*
const minimalTestFunction = inngest.createFunction(
  { id: "minimal-test-func", name: "Minimal Test Function" },
  { event: "test/minimal" }, // Using a different event name
  ({ event }) => {
    // Simple log to confirm execution
    console.log("--- MINIMAL FUNCTION EXECUTED ---", { eventName: event.name })
    log(
      "info",
      "MINIMAL_FUNC_EXEC",
      "Minimal function executed successfully.",
      { eventName: event.name }
    )
    // Return a simple success message
    return { message: "Minimal function ran successfully" }
  }
)
*/

// --- Minimal Fastify Server for E2E Test --- //
import Fastify from "fastify"
// Используем плагин для Fastify
// ВРЕМЕННО ЗАКОММЕНТИРОВАНО ДЛЯ ДИАГНОСТИКИ EADDRINUSE -> Убираем комментарий
import { fastifyPlugin } from "inngest/fastify"

const PORT = 8484 // Должен совпадать с APP_SERVER_URL в тесте

const fastify = Fastify({
  // Можно добавить logger: true для отладки Fastify, если нужно
  logger: true, // Включаем логгер Fastify
})

// Логируем тип функции перед регистрацией
log("info", "FASTIFY_REGISTER", "Registering Inngest plugin", {
  functionType: typeof codingAgentFunction,
})

// Регистрируем плагин Inngest - *** ТЕПЕРЬ ОСНОВНУЮ ФУНКЦИЮ ***
// ВРЕМЕННО ЗАКОММЕНТИРОВАНО ДЛЯ ДИАГНОСТИКИ EADDRINUSE -> Убираем комментарий
// /*
fastify.register(fastifyPlugin, {
  client: inngest,
  functions: [codingAgentFunction], // Заменено на основную функцию
  // Опции для плагина, если нужны (например, путь endpoint)
  options: {
    // serveHost, servePath, logLevel и т.д. можно указать здесь
    // По умолчанию будет /api/inngest
  },
})
// */

// Базовый обработчик для GET /, чтобы waitForUrl мог проверить доступность
fastify.get("/", async (_request, reply) => {
  log("info", "FASTIFY_GET_ROOT", "Received request for / route") // Добавляем лог
  return reply.send("OK")
})

// Запускаем Fastify сервер
const start = async () => {
  try {
    await fastify.listen({ port: PORT, host: "0.0.0.0" })
    log(
      "info",
      "FASTIFY_SERVER_START",
      `Minimal Fastify server listening on ${PORT}`
    )
  } catch (err) {
    log("error", "FASTIFY_SERVER_ERROR", `Fastify server error: ${err}`)
    fastify.log.error(err) // Используем логгер Fastify
    process.exit(1)
  }
}
start() // Возвращаем вызов на верхнем уровне

// --- Utils related to Inngest ---
// We might keep the getSandbox util here or move it.
// Let's assume it's in ./logic/utils for now as originally intended.
export { getSandbox } from "./logic/utils" // Re-export if needed -> Раскомментировано
