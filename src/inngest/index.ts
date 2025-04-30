/* eslint-disable @typescript-eslint/no-explicit-any */
import "dotenv/config"

import { Inngest /*, type Context, type EventPayload*/ } from "inngest"
import { CodingAgentHandlerArgs } from "@/types/inngest"
import { validateEventData } from "@/inngest/logic/validateEventData"
import { ensureSandboxId } from "@/inngest/logic/sandboxUtils"
import { getCurrentState, logFinalResult } from "@/inngest/logic/stateUtils"
import { createAgentDependencies } from "@/inngest/logic/dependencyUtils"
import { processNetworkResult } from "@/inngest/logic/resultUtils"
import { createDevOpsNetwork } from "@/network/network"
import { HandlerStepName } from "@/types/handlerSteps"
import { log } from "@/utils/logic/logger"
// FIX: Remove unused NetworkRun and TddNetworkState imports
// import type { NetworkRun } from "@inngest/agent-kit"
// import { TddNetworkState } from "@/types/network"

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
  async ({ event, step, logger }: CodingAgentHandlerArgs) => {
    const eventId = event.id ?? "unknown-event-id"
    logger.info("Full event data:", {
      step: "HANDLER_DEBUG_FULL_EVENT",
      eventId,
      event,
    })
    logger.info("Handler invoked.", {
      step: HandlerStepName.HANDLER_ENTERED,
      eventId,
      functionId: "coding-agent/run",
    })

    // 1. Validate Event Data
    const validation = validateEventData(event, logger)
    if (!validation.data) {
      logger.error(`Invalid event data: ${validation.error}`, {
        step: HandlerStepName.HANDLER_INVALID_DATA,
        eventId,
      })
      return { success: false, error: validation.error }
    }
    const { input: task, currentState: initialStateFromEvent } = validation.data

    // 2. Ensure Sandbox ID
    const sandboxId = await ensureSandboxId(
      initialStateFromEvent,
      step,
      logger,
      eventId
    )
    if (!sandboxId) {
      return { success: false, error: "Failed to ensure sandbox ID." }
    }

    // 3. Create Dependencies
    const agentDeps = await createAgentDependencies(logger, sandboxId, eventId)

    // 4. Get Current State
    const currentState = await getCurrentState(
      logger,
      agentDeps.kv,
      task,
      eventId
    )
    if (!currentState) {
      return { success: false, error: "Failed to get or initialize state." }
    }
    if (currentState.sandboxId !== sandboxId) {
      currentState.sandboxId = sandboxId
      await agentDeps.kv?.set("sandboxId", sandboxId)
    }

    // 5. Run the Agent Network
    logger.info(`Starting agent network run. Status: ${currentState.status}`, {
      step: HandlerStepName.NETWORK_RUN_START,
      eventId,
      status: currentState.status,
    })
    const network = createDevOpsNetwork(agentDeps)
    const result: any = await step.run("run-agent-network", async () => {
      try {
        const networkRunResult = await network.run(task, {
          // Pass initialState option correctly
          // initialState: currentState,
        })
        return networkRunResult
      } catch (networkError) {
        logger.error("Error during agent network run.", {
          step: HandlerStepName.NETWORK_RUN_ERROR,
          eventId,
          error:
            networkError instanceof Error
              ? networkError.message
              : String(networkError),
          stack: networkError instanceof Error ? networkError.stack : undefined,
        })
        throw networkError
      }
    })
    logger.info("Agent network run finished.", {
      step: HandlerStepName.NETWORK_RUN_SUCCESS,
      eventId,
    })

    // 6. Process Result
    const processingResult = await processNetworkResult(
      result,
      step,
      logger,
      eventId
    )

    // 7. Log Final State and Return
    const finalState = processingResult?.finalState || currentState
    logFinalResult(finalState, logger)

    if (processingResult) {
      logger.info("Handler processing complete after action.", {
        step: HandlerStepName.HANDLER_COMPLETED,
        eventId,
      })
      return { success: true, ...processingResult }
    }

    logger.info("Handler processing complete.", {
      step: HandlerStepName.HANDLER_COMPLETED,
      eventId,
    })
    return { success: true, finalStatus: finalState.status }
  }
)
