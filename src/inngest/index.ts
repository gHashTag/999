/* eslint-disable @typescript-eslint/no-explicit-any */
import "dotenv/config"

import { Inngest } from "inngest"
import { type TddNetworkState } from "@/types/network"
import { CodingAgentHandlerArgs } from "@/types/inngest"
import { validateEventData } from "@/inngest/logic/validateEventData"
import { ensureSandboxId } from "@/inngest/logic/sandboxUtils"
import { initializeOrRestoreState } from "@/inngest/logic/stateUtils"
import { createAgentDependencies } from "@/inngest/logic/dependencyUtils"
import { processNetworkResult } from "@/inngest/logic/resultUtils"
import { createDevOpsNetwork } from "@/network/network"
import { HandlerStepName } from "@/types/handlerSteps"
import { Network } from "@inngest/agent-kit"
import { log } from "@/utils/logic/logger"

log(
  "info",
  "TOP_LEVEL",
  `[index.ts TOP LEVEL] NODE_ENV: ${process.env.NODE_ENV}`
)

// Initialize Inngest Client
// If we have a custom logger (like Winston), pass it here
// export const inngest = new Inngest({ id: "agentkit-tdd-agent", logger: customLogger });
export const inngest = new Inngest({
  id: "agentkit-tdd-agent",
  // logger: log, // Removed: Incorrect usage. Rely on default or handler-provided logger.
}) // Using custom file logger now // <- Comment misleading, removed custom logger for now

// Define the Inngest function *before* the handler that uses it for invoke
// Note: We define the handler function below, TS allows this forward reference.
export const runCodingAgent = inngest.createFunction(
  { id: "run-coding-agent-network", name: "Run Coding Agent Network" },
  { event: "coding-agent/run" },
  codingAgentHandler // Defined below
)
// --- Main Handler (Restored Full Logic) --- //
async function codingAgentHandler({
  event,
  step,
  logger,
}: CodingAgentHandlerArgs) {
  // Log the full event object at the very beginning
  logger.info(
    { step: "HANDLER_DEBUG_FULL_EVENT" },
    "Inspecting full event object received from @inngest/test:",
    { fullEvent: event }
  )

  const handlerStartTime = Date.now()
  logger.info({ step: HandlerStepName.HANDLER_ENTERED }, "Handler invoked.", {
    eventId: event?.id,
    eventName: event?.name,
    rawData: event?.data, // Log raw data for debugging
  })

  let finalState: TddNetworkState | null = null // Initialize finalState

  try {
    // 1. Validate Data
    const validationResult = validateEventData(event, logger)
    if (validationResult.error) {
      // Return error consistent with the catch block format
      return {
        error: validationResult.error,
        finalState: null,
        executionTimeMs: Date.now() - handlerStartTime,
      }
    }
    const validatedEventData = validationResult.data!
    const eventId = event.id ?? "unknown-event-id" // Use actual or default event ID

    // 2. Ensure Sandbox ID
    // Note: In test environment, ensureSandboxId is mocked via vi.mock
    const sandboxId = await ensureSandboxId(
      validatedEventData.currentState,
      step,
      logger,
      eventId
    )

    // 3. Initialize or Restore State
    const currentState = initializeOrRestoreState(
      validatedEventData,
      sandboxId,
      logger,
      eventId
    )
    finalState = currentState // Update finalState after initialization/restore

    // 4. Create Dependencies (Agents, Tools)
    const agentDeps = await createAgentDependencies(logger, sandboxId, eventId)
    const agents = agentDeps.agents // Extract agents

    // Add a check to satisfy TypeScript's potential undefined concern
    if (
      !agents ||
      !agents.teamLead ||
      !agents.tester ||
      !agents.coder ||
      !agents.critic ||
      !agents.tooling
    ) {
      throw new Error("Failed to create one or more core agents.")
    }

    // 5. Create and Run Network - Pass agents individually
    const devOpsNetwork: Network<TddNetworkState> = createDevOpsNetwork(
      agents.teamLead, // Pass individual agents
      agents.tester,
      agents.coder,
      agents.critic,
      agents.tooling
    )

    logger.info(
      { step: HandlerStepName.NETWORK_RUN_START },
      "Starting agent network run.",
      { eventId, initialState: currentState }
    )
    // Remove setting state before run
    // devOpsNetwork.state.kv.set('network_state', currentState);
    // FIX: Call network.run with the task description string
    const result = await devOpsNetwork.run(currentState.task)

    // Get final state from KV store (assuming router saves it under 'network_state')
    // Reading the final state from result.state.kv should still be correct
    finalState = (result.state.kv.get("network_state") ||
      result.state.kv.all()) as TddNetworkState

    logger.info(
      { step: HandlerStepName.NETWORK_RUN_SUCCESS },
      "Agent network run completed.",
      {
        eventId,
        finalStatus: finalState?.status,
      }
    )

    // 6. Process Result
    return await processNetworkResult(result, step, logger, eventId)
  } catch (error: any) {
    const executionTimeMs = Date.now() - handlerStartTime
    logger.error(
      { step: HandlerStepName.HANDLER_ERROR },
      "An error occurred in the handler.",
      {
        error: error.message,
        stack: error.stack,
        finalStateBeforeError: finalState, // Log the state before the error
        executionTimeMs,
      }
    )
    // Ensure consistent return format on error
    return {
      error: error.message || "Unknown handler error",
      finalState: finalState, // Return the last known state
      executionTimeMs,
    }
  }
}
