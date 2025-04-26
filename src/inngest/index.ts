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
import { log } from "@/utils/logic/logger"
import { getSandbox } from "./logic/utils" // Ensure this uses @e2b/sdk internally
import { TddNetworkState, NetworkStatus } from "@/types/network"
import { systemEvents } from "@/utils/logic/systemEvents"

// Initialize Inngest Client
export const inngest = new Inngest({ id: "agentkit-tdd-agent" })

log("info", "ENV_CHECK", "Checking Keys", {
  inngestKey: process.env.INNGEST_SIGNING_KEY ? "Loaded" : "MISSING",
  deepseekKey: process.env.DEEPSEEK_API_KEY ? "Loaded" : "MISSING",
})

// Define the Inngest function *before* the handler that uses it for invoke
// Note: We define the handler function below, TS allows this forward reference.
export const runCodingAgent = inngest.createFunction(
  { id: "run-coding-agent-network", name: "Run Coding Agent Network" },
  { event: "coding-agent/run" },
  codingAgentHandler
)

// --- Main Handler --- //
async function codingAgentHandler({
  event,
  step,
}: {
  event: EventPayload<CodingAgentEvent>
  step: Context["step"]
}) {
  const handlerStartTime = Date.now()
  log("info", "HANDLER_ENTERED", "Handler invoked.", {
    eventId: event?.id,
    eventName: event?.name,
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

  let currentState = validatedData.data.currentState as
    | TddNetworkState
    | undefined
  const taskInput = validatedData.data.input
  const eventId = event.id
  if (!eventId) {
    log(
      "error",
      "HANDLER_MISSING_EVENT_ID",
      "Event ID is missing after validation."
    )
    throw new Error("Event ID is missing after validation.")
  }

  try {
    let currentSandboxId: string | null | undefined = currentState?.sandboxId

    if (!currentSandboxId) {
      log("info", "GET_SANDBOX_ID_START", "No sandbox ID, creating new.", {
        eventId,
      })
      const newSandboxId = await step.run("get-sandbox-id", async () => {
        log("info", "CREATE_SANDBOX_STEP_START", "Creating sandbox...", {
          eventId,
        })
        const sandbox = await Sandbox.create({ autoPause: true })
        log("info", "CREATE_SANDBOX_STEP_END", "Sandbox created.", {
          eventId,
          newSandboxId: sandbox.sandboxId,
        })
        return sandbox.sandboxId
      })
      currentSandboxId = newSandboxId
      log("info", "GET_SANDBOX_ID_END", "Got new sandbox ID.", {
        eventId,
        sandboxId: currentSandboxId,
      })
    } else {
      log("info", "GET_SANDBOX_ID_SKIP", "Reusing existing sandbox ID.", {
        eventId,
        sandboxId: currentSandboxId,
      })
    }

    if (!currentSandboxId)
      throw new Error("Sandbox ID missing after creation attempt.")

    if (!currentState) {
      currentState = {
        task: taskInput,
        status: NetworkStatus.Enum.NEEDS_REQUIREMENTS_CRITIQUE,
        sandboxId: currentSandboxId,
      }
      log("info", "STATE_INITIALIZED", "Initialized new state.", {
        eventId,
        sandboxId: currentSandboxId,
        status: currentState.status,
      })
    } else {
      currentState.sandboxId = currentSandboxId
      if (!currentState.status) {
        currentState.status = NetworkStatus.Enum.NEEDS_REQUIREMENTS_CRITIQUE
        log(
          "warn",
          "STATE_STATUS_MISSING",
          "Status missing, setting to NEEDS_REQUIREMENTS_CRITIQUE.",
          { eventId }
        )
      }
      log("info", "STATE_REUSED", "Reusing existing state.", {
        eventId,
        sandboxId: currentSandboxId,
        status: currentState.status,
      })
    }

    log("info", "CREATE_TOOLS_START", "Creating tools...", {
      eventId,
      sandboxId: currentSandboxId,
    })
    const allTools = getAllTools(log, getSandbox, eventId, currentSandboxId)
    log("info", "CREATE_TOOLS_END", "Tools created.", {
      eventId,
      sandboxId: currentSandboxId,
      toolCount: allTools.length,
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
      systemEvents,
      sandbox: await getSandbox(currentSandboxId),
    }
    const teamLeadAgent = createTeamLeadAgent(agentDeps)
    const testerAgent = createTesterAgent(agentDeps)
    const codingAgent = createCodingAgent(agentDeps)
    const criticAgent = createCriticAgent(agentDeps)
    const toolingAgent = createToolingAgent(agentDeps)
    log("info", "CREATE_AGENTS_END", "Agents created.", {
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

    log("info", "STATE_RESTORE_NETWORK", "Restoring state into network.", {
      eventId,
      status: currentState.status,
    })
    if (!currentState)
      throw new Error("currentState is undefined before setting KV store")
    devOpsNetwork.state.kv.set("network_state", currentState)

    log("info", "NETWORK_RUN_START", "Running DevOps network...", {
      eventId,
      currentStatus: currentState.status,
    })
    let networkResult: NetworkRun<TddNetworkState> | undefined
    try {
      networkResult = await devOpsNetwork.run(currentState.task)
      log("info", "NETWORK_RUN_INTERNAL_END", "DevOps network step finished.", {
        eventId,
        resultKeys: networkResult ? Object.keys(networkResult) : null,
      })
    } catch (networkError: any) {
      log(
        "error",
        "NETWORK_RUN_INTERNAL_ERROR",
        "Error inside devOpsNetwork.run()",
        { eventId, error: networkError.message, stack: networkError.stack }
      )
      throw networkError
    }

    if (!networkResult) {
      log("warn", "NETWORK_RUN_NO_RESULT", "Network run returned undefined.", {
        eventId,
      })
      if (currentState) {
        currentState.status = NetworkStatus.Enum.FAILED
      } else {
        log(
          "error",
          "HANDLER_CRITICAL_STATE_LOSS_NO_RESULT",
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
      log(
        "error",
        "HANDLER_FINAL_STATE_MISSING",
        "Final state missing from network result KV.",
        { eventId }
      )
      if (currentState) {
        currentState.status = NetworkStatus.Enum.FAILED
      } else {
        log(
          "error",
          "HANDLER_CRITICAL_STATE_LOSS_NO_FINAL",
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

    log("info", "HANDLER_PROCESS_RESULT", "Processing network result.", {
      eventId,
      finalStatus: finalState.status,
      commandToExecute: finalState.command_to_execute,
    })

    // --- Command Execution Logic ---
    if (finalState.status === NetworkStatus.Enum.NEEDS_COMMAND_EXECUTION) {
      const command = finalState.command_to_execute
      if (command && command.trim()) {
        log(
          "info",
          "HANDLER_RUN_COMMAND",
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
            log(
              "warn",
              "E2B_STUBBED",
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

        log("info", "HANDLER_COMMAND_EXECUTED", "Command execution stubbed.", {
          eventId,
          exitCode: commandOutput.exitCode,
        })

        finalState.last_command_output = `Exit Code: ${commandOutput.exitCode}\n\nSTDOUT:\n${commandOutput.stdout}\n\nSTDERR:\n${commandOutput.stderr}`
        finalState.status = NetworkStatus.Enum.NEEDS_COMMAND_VERIFICATION
        finalState.command_to_execute = undefined

        log(
          "info",
          "HANDLER_REINVOKE_AFTER_COMMAND",
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
        log(
          "warn",
          "HANDLER_NO_COMMAND",
          "Status NEEDS_COMMAND_EXECUTION but command is empty.",
          { eventId }
        )
        finalState.status = NetworkStatus.Enum.FAILED
      }
    } else if (finalState.status === NetworkStatus.Enum.NEEDS_HUMAN_INPUT) {
      log("info", "HANDLER_HUMAN_INPUT_NEEDED", "Stopping for human input.", {
        eventId,
        finalStatus: finalState.status,
      })
      // Stop the process
    } else {
      log("info", "HANDLER_NO_ACTION", "No further action needed by handler.", {
        eventId,
        finalStatus: finalState.status,
      })
    }

    const handlerEndTime = Date.now()
    log("info", "HANDLER_COMPLETED", "Handler finished processing.", {
      eventId,
      finalStatus: finalState.status,
      durationMs: handlerEndTime - handlerStartTime,
    })
    return { message: "Agent network run completed.", finalState }
  } catch (error: any) {
    const handlerEndTime = Date.now()
    log("error", "HANDLER_ERROR", "An error occurred in the handler.", {
      eventId,
      error: error.message,
      stack: error.stack,
      durationMs: handlerEndTime - handlerStartTime,
    })
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
