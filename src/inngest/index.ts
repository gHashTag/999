/* eslint-disable @typescript-eslint/no-explicit-any */
import "dotenv/config"

import { Inngest, type Context, type EventPayload } from "inngest"
import { Sandbox } from "@e2b/sdk" // Use @e2b/sdk
import { createDevOpsNetwork, type NetworkRun } from "@/network/network"
import { CodingAgentEvent, codingAgentEventSchema } from "@/types/events"
import { AgentDependencies } from "@/types/agents"
import { getAllTools } from "@/tools/toolDefinitions"
import {
  createTesterAgent,
  createCodingAgent,
  createCriticAgent,
  createTeamLeadAgent,
  createToolingAgent,
} from "@/agents"
// import { log } from "@/utils/logic/logger" // No longer needed here
import { getSandbox } from "./logic/utils" // Ensure this uses @e2b/sdk internally
import { TddNetworkState, NetworkStatus } from "@/types/network"
import { systemEvents } from "@/utils/logic/systemEvents"

// Initialize Inngest Client
// If we have a custom logger (like Winston), pass it here
// export const inngest = new Inngest({ id: "agentkit-tdd-agent", logger: customLogger });
export const inngest = new Inngest({ id: "agentkit-tdd-agent" }) // Using default console logger for now

// Initial ENV check might still use the global logger if needed before handler context exists
// Or we can move this check inside the handler if preferred
// import { log as globalLog } from "@/utils/logic/logger" // Use a different name if needed
// globalLog("info", "ENV_CHECK", "Checking Keys", {
//   inngestKey: process.env.INNGEST_SIGNING_KEY ? "Loaded" : "MISSING",
//   deepseekKey: process.env.DEEPSEEK_API_KEY ? "Loaded" : "MISSING",
// })

// Define Logger interface locally based on observed .d.ts
interface HandlerLogger {
  info(...args: unknown[]): void
  warn(...args: unknown[]): void
  error(...args: unknown[]): void
  debug(...args: unknown[]): void
}

// Define the type for the handler arguments
type CodingAgentHandlerArgs = {
  event: EventPayload<CodingAgentEvent>
  step: Context["step"]
  logger: HandlerLogger
}

// Define the Inngest function *before* the handler that uses it for invoke
// Note: We define the handler function below, TS allows this forward reference.
export const runCodingAgent = inngest.createFunction(
  { id: "run-coding-agent-network", name: "Run Coding Agent Network" },
  { event: "coding-agent/run" },
  codingAgentHandler // Defined below
)

// --- Main Handler --- //
async function codingAgentHandler({
  event,
  step,
  logger,
}: CodingAgentHandlerArgs) {
  const handlerStartTime = Date.now()
  // Use contextual logger
  logger.info(
    { step: "HANDLER_ENTERED" }, // Inngest logger often takes metadata as first arg
    "Handler invoked.",
    {
      eventId: event?.id,
      eventName: event?.name,
      incomingStatus: (event.data as any)?.currentState?.status,
    }
  )

  if (!step) {
    // Use contextual logger
    logger.error({ step: "STEP_UNDEFINED" }, "Step context is undefined!", {
      eventId: event?.id,
    })
    return { error: "Step context was undefined." }
  }

  const validatedData = codingAgentEventSchema.safeParse(event.data)
  if (!validatedData.success) {
    // Use contextual logger
    logger.error(
      { step: "HANDLER_INVALID_DATA" },
      "Invalid event data received.",
      {
        eventId: event?.id,
        validationErrors: validatedData.error.issues,
      }
    )
    return { error: "Invalid event data." }
  }

  let currentState = validatedData.data.currentState as
    | TddNetworkState
    | undefined
  const taskInput = validatedData.data.input
  const eventId = event.id
  if (!eventId) {
    // Use contextual logger
    logger.error(
      { step: "HANDLER_MISSING_EVENT_ID" },
      "Event ID is missing after validation."
    )
    throw new Error("Event ID is missing after validation.")
  }

  try {
    let currentSandboxId: string | null | undefined = currentState?.sandboxId

    // --- Logging Sandbox ID --- //
    // Use contextual logger
    logger.info(
      { step: "SANDBOX_CHECK_START" },
      "Checking for existing sandbox ID.",
      {
        eventId,
      }
    )
    if (!currentSandboxId) {
      // Use contextual logger
      logger.info(
        { step: "GET_SANDBOX_ID_START" },
        "No sandbox ID, creating new.",
        {
          eventId,
        }
      )
      const newSandboxId = await step.run("get-sandbox-id", async () => {
        // Use contextual logger (from outer scope)
        logger.info(
          { step: "CREATE_SANDBOX_STEP_START" },
          "Creating sandbox...",
          {
            eventId,
          }
        )
        const sandbox = await Sandbox.create({ autoPause: true })
        // Use contextual logger
        logger.info({ step: "CREATE_SANDBOX_STEP_END" }, "Sandbox created.", {
          eventId,
          newSandboxId: sandbox.sandboxId,
        })
        return sandbox.sandboxId
      })
      currentSandboxId = newSandboxId
      // Use contextual logger
      logger.info({ step: "GET_SANDBOX_ID_END" }, "Got new sandbox ID.", {
        eventId,
        sandboxId: currentSandboxId,
      })
    } else {
      // Use contextual logger
      logger.info(
        { step: "GET_SANDBOX_ID_SKIP" },
        "Reusing existing sandbox ID.",
        {
          eventId,
          sandboxId: currentSandboxId,
        }
      )
    }
    // Use contextual logger
    logger.info({ step: "SANDBOX_CHECK_END" }, "Finished sandbox ID check.", {
      eventId,
      sandboxId: currentSandboxId,
    })

    if (!currentSandboxId)
      throw new Error("Sandbox ID missing after creation attempt.")

    // --- Logging State Initialization --- //
    // Use contextual logger
    logger.info({ step: "STATE_INIT_START" }, "Initializing/Reusing state.", {
      eventId,
      inputTask: taskInput,
      hasCurrentState: !!currentState,
    })

    if (!currentState) {
      currentState = {
        task: taskInput,
        status: NetworkStatus.Enum.NEEDS_REQUIREMENTS_CRITIQUE,
        sandboxId: currentSandboxId,
      }
      // Use contextual logger
      logger.info({ step: "STATE_INITIALIZED" }, "Initialized new state.", {
        eventId,
        sandboxId: currentSandboxId,
        status: currentState.status,
      })
    } else {
      currentState.sandboxId = currentSandboxId // Ensure sandboxId is updated even if state exists
      if (!currentState.status) {
        currentState.status = NetworkStatus.Enum.NEEDS_REQUIREMENTS_CRITIQUE
        // Use contextual logger
        logger.warn(
          { step: "STATE_STATUS_MISSING" },
          "Status missing, setting to NEEDS_REQUIREMENTS_CRITIQUE.",
          { eventId }
        )
      }
      // Use contextual logger
      logger.info({ step: "STATE_REUSED" }, "Reusing existing state.", {
        eventId,
        sandboxId: currentSandboxId,
        status: currentState.status,
      })
    }
    // Use contextual logger
    logger.info({ step: "STATE_INIT_END" }, "Finished state initialization.", {
      eventId,
      finalStatus: currentState?.status,
    })

    // Use contextual logger for creating tools message
    logger.info({ step: "CREATE_TOOLS_START" }, "Creating tools...", {
      eventId,
      sandboxId: currentSandboxId,
    })
    // Pass the contextual logger to getAllTools
    const allTools = getAllTools(
      logger, // Use the contextual logger
      getSandbox,
      eventId,
      currentSandboxId
    )
    logger.info({ step: "CREATE_TOOLS_END" }, "Tools created.", {
      eventId,
      sandboxId: currentSandboxId,
      toolCount: allTools.length,
    })

    // Use contextual logger for creating agents message
    logger.info({ step: "CREATE_AGENTS_START" }, "Creating agents...", {
      eventId,
      sandboxId: currentSandboxId,
    })
    // Pass the contextual logger to AgentDependencies
    const agentDeps: AgentDependencies = {
      allTools,
      log: logger, // Use the contextual logger
      apiKey: process.env.DEEPSEEK_API_KEY!,
      modelName: process.env.DEEPSEEK_MODEL || "deepseek-coder",
      systemEvents,
      sandbox: await getSandbox(currentSandboxId),
    }
    const teamLeadAgent = createTeamLeadAgent(agentDeps)
    const testerAgent = createTesterAgent(agentDeps)
    const codingAgent = createCodingAgent(agentDeps)
    const criticAgent = createCriticAgent(agentDeps)
    const toolingAgent = createToolingAgent(agentDeps)
    // Use contextual logger
    logger.info({ step: "CREATE_AGENTS_END" }, "Agents created.", {
      eventId,
      sandboxId: currentSandboxId,
    })

    const devOpsNetwork = createDevOpsNetwork(
      teamLeadAgent,
      testerAgent,
      codingAgent,
      criticAgent,
      toolingAgent
    )

    // Use contextual logger
    logger.info(
      { step: "STATE_BEFORE_KV_SET" }, // Keep the debug log for now
      "Logging currentState before setting in network KV.",
      {
        eventId,
        currentStateObject: JSON.stringify(currentState, null, 2), // Log the whole object
      }
    )
    logger.info(
      { step: "STATE_RESTORE_NETWORK" },
      "Restoring state into network.",
      {
        eventId,
        status: currentState.status,
      }
    )

    if (!currentState)
      throw new Error("currentState is undefined before setting KV store")
    devOpsNetwork.state.kv.set("network_state", currentState)

    // Use contextual logger
    logger.info({ step: "NETWORK_RUN_START" }, "Running DevOps network...", {
      eventId,
      currentStatus: currentState.status,
    })

    let networkResult: NetworkRun<TddNetworkState> | undefined
    try {
      networkResult = await devOpsNetwork.run(currentState.task)
      // Use contextual logger
      logger.info(
        { step: "NETWORK_RUN_SUCCESS" },
        "DevOps network finished successfully.",
        {
          eventId,
          finalStatus: networkResult?.state.kv.get("network_state")?.status,
        }
      )
    } catch (networkError: any) {
      // Use contextual logger
      logger.error({ step: "NETWORK_RUN_ERROR" }, "Error during network run.", {
        eventId,
        error: networkError.message,
        stack: networkError.stack,
      })

      throw networkError
    }

    if (!networkResult) {
      // Use contextual logger
      logger.warn(
        { step: "NETWORK_RUN_NO_RESULT" },
        "Network run returned undefined.",
        {
          eventId,
        }
      )

      if (currentState) {
        currentState.status = NetworkStatus.Enum.FAILED
      } else {
        // Use contextual logger
        logger.error(
          { step: "HANDLER_CRITICAL_STATE_LOSS_NO_RESULT" },
          "Original currentState lost and network returned no result.",
          { eventId }
        )

        throw new Error(
          "Critical state loss during handler execution - no network result."
        )
      }
      return {
        message: "Agent network run returned no result.",
        finalState: currentState,
      }
    }

    const finalState = networkResult.state.kv.get("network_state") as
      | TddNetworkState
      | undefined

    if (!finalState) {
      // Use contextual logger
      logger.error(
        { step: "HANDLER_FINAL_STATE_MISSING" },
        "Final state missing from network result KV.",
        { eventId }
      )

      if (currentState) {
        currentState.status = NetworkStatus.Enum.FAILED
      } else {
        // Use contextual logger
        logger.error(
          { step: "HANDLER_CRITICAL_STATE_LOSS_NO_FINAL" },
          "Original currentState lost and final state missing.",
          { eventId }
        )

        throw new Error(
          "Critical state loss during handler execution - no final state."
        )
      }
      return {
        error: "Final state missing after network run.",
        finalState: currentState,
      }
    }

    // Use contextual logger
    logger.info(
      { step: "FINAL_STATE_LOGGING" },
      "Logging final state before handler exit.",
      {
        eventId,
        status: finalState.status,
        task: finalState.task,
      }
    )

    // Use contextual logger
    logger.info(
      { step: "HANDLER_PROCESS_RESULT" },
      "Processing network result.",
      {
        eventId,
        finalStatus: finalState.status,
        commandToExecute: finalState.command_to_execute,
      }
    )

    // --- Command Execution Logic ---
    if (finalState.status === NetworkStatus.Enum.NEEDS_COMMAND_EXECUTION) {
      const command = finalState.command_to_execute
      if (command && command.trim()) {
        // Use contextual logger
        logger.info(
          { step: "HANDLER_RUN_COMMAND" },
          "Running command (currently stubbed)...",
          {
            eventId,
            command,
          }
        )

        // Temporarily stub out E2B command execution <<<--- STUBBED BLOCK
        const commandOutput = await step.run(
          "execute-command-stubbed",
          async () => {
            // Return dummy data for now
            // Use contextual logger
            logger.warn(
              { step: "E2B_STUBBED" },
              "E2B command execution is currently stubbed.",
              { eventId }
            )

            return {
              stdout: "[STUBBED] Command output for: " + command,
              stderr: "",
              exitCode: 0,
            }
          }
        ) // <<<--- END OF STUBBED BLOCK

        // Use contextual logger
        logger.info(
          { step: "HANDLER_COMMAND_EXECUTED" },
          "Command execution stubbed.",
          {
            eventId,
            exitCode: commandOutput.exitCode,
          }
        )

        finalState.last_command_output = `Exit Code: ${commandOutput.exitCode}\\n\\nSTDOUT:\\n${commandOutput.stdout}\\n\\nSTDERR:\\n${commandOutput.stderr}`
        finalState.status = NetworkStatus.Enum.NEEDS_COMMAND_VERIFICATION
        finalState.command_to_execute = undefined

        // Use contextual logger
        logger.info(
          { step: "HANDLER_REINVOKE_AFTER_COMMAND" },
          "Re-invoking handler after command.",
          { eventId, newStatus: finalState.status }
        )

        // Correct step.invoke structure: invoke(stepId, { function, data }) <<<--- CORRECT INVOKE STRUCTURE
        await step.invoke(
          "reinvoke-handler-after-command", // Step ID (string)
          {
            // Options object
            function: runCodingAgent, // The function to invoke
            data: {
              // Data payload
              input: finalState.task,
              currentState: finalState,
            },
          }
        )
        return {
          message: "Command execution stubbed, re-invoked handler.",
          finalState,
        }
      } else {
        // Use contextual logger
        logger.warn(
          { step: "HANDLER_NO_COMMAND" },
          "Status NEEDS_COMMAND_EXECUTION but command is empty.",
          { eventId }
        )

        finalState.status = NetworkStatus.Enum.FAILED
      }
    } else if (finalState.status === NetworkStatus.Enum.NEEDS_HUMAN_INPUT) {
      // Use contextual logger
      logger.info(
        { step: "HANDLER_HUMAN_INPUT_NEEDED" },
        "Stopping for human input.",
        {
          eventId,
          finalStatus: finalState.status,
        }
      )

      // Stop the process
    } else {
      // Use contextual logger
      logger.info(
        { step: "HANDLER_NO_ACTION" },
        "No further action needed by handler.",
        {
          eventId,
          finalStatus: finalState.status,
        }
      )
    }

    const handlerEndTime = Date.now()
    // Use contextual logger
    logger.info({ step: "HANDLER_COMPLETED" }, "Handler finished processing.", {
      eventId,
      finalStatus: finalState.status,
      durationMs: handlerEndTime - handlerStartTime,
    })

    return { message: "Agent network run completed.", finalState }
  } catch (error: any) {
    const handlerEndTime = Date.now()
    // Use contextual logger
    logger.error(
      { step: "HANDLER_ERROR" },
      "An error occurred in the handler.",
      {
        eventId,
        error: error.message,
        stack: error.stack,
        durationMs: handlerEndTime - handlerStartTime,
      }
    )

    if (currentState) {
      currentState.status = NetworkStatus.Enum.FAILED
    }
    return {
      error: `Handler failed: ${error.message}`,
      finalState: currentState,
    }
  }
}

// Definition is now at the top, before usage in invoke
// export const runCodingAgent = inngest.createFunction(
//   { id: "run-coding-agent-network", name: "Run Coding Agent Network" },
//   { event: "coding-agent/run" },
//   codingAgentHandler
// );
