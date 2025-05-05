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
import { runTypeCheck } from "@/inngest/functions/runTypeCheck"
import { runVitest } from "@/inngest/functions/runVitest"
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

    // 5. Run the Agent Network for TeamLead
    logger.info(
      `Starting agent network run for TeamLead. Status: ${currentState.status}`,
      {
        step: HandlerStepName.NETWORK_RUN_START,
        eventId,
        status: currentState.status,
      }
    )
    const network = createDevOpsNetwork(agentDeps)
    const teamLeadResult = await step.run(
      "run-agent-network-teamlead",
      async () => {
        logger.info("Running agent network for TeamLead")
        return await network.run(`Coding task for event ${eventId}`)
      }
    )

    const stateAfterTeamLead =
      teamLeadResult.state && teamLeadResult.state.data
        ? teamLeadResult.state.data.status || "UNKNOWN"
        : "UNKNOWN"
    logger.info("State after TeamLead run: " + stateAfterTeamLead, {
      eventId,
    })

    if (stateAfterTeamLead !== "NEEDS_CODE") {
      logger.warn(
        "Unexpected state after TeamLead run: " + stateAfterTeamLead,
        {
          eventId,
        }
      )
      return {
        status: stateAfterTeamLead,
        message: "Waiting for implementation phase",
      }
    }

    // 6. Process TeamLead Result
    let processingResult = await processNetworkResult(
      teamLeadResult,
      step,
      logger,
      eventId
    )
    let finalState = processingResult?.finalState || currentState

    // 6.1 Run the Agent Network for Coder if status is NEEDS_CODE
    let coderResult = null
    if (finalState.status === "NEEDS_CODE") {
      logger.info("Starting agent network run for Coder.", {
        step: "NETWORK_RUN_CODER_START",
        eventId,
        status: finalState.status,
      })
      coderResult = await step.run("run-agent-network-coder", async () => {
        logger.info("Running agent network for Coder")
        return await network.run(`Coding task for event ${eventId}`)
      })

      const stateAfterCoder =
        coderResult.state && coderResult.state.data
          ? coderResult.state.data.status || "UNKNOWN"
          : "UNKNOWN"
      logger.info("State after Coder run: " + stateAfterCoder, {
        eventId,
      })

      if (
        stateAfterCoder !== "NEEDS_TYPE_CHECK" &&
        stateAfterCoder !== "NEEDS_TEST_CRITIQUE"
      ) {
        logger.warn("Unexpected state after Coder run: " + stateAfterCoder, {
          eventId,
        })
        return {
          status: stateAfterCoder,
          message: "Waiting for type check or critique phase",
        }
      }

      // Process Coder Result
      processingResult = await processNetworkResult(
        coderResult,
        step,
        logger,
        eventId
      )
      finalState = processingResult?.finalState || finalState
    }

    // 6.2 Add Type Check Step if status is NEEDS_TYPE_CHECK
    let typeCheckResult = null
    if (
      finalState.status === "NEEDS_TYPE_CHECK" ||
      finalState.status === "NEEDS_IMPLEMENTATION_CRITIQUE"
    ) {
      logger.info("Running type check for generated code.", {
        step: "RUN_TYPE_CHECK_START",
        eventId,
      })
      const codeToCheck = finalState.implementation_code || ""
      if (!codeToCheck) {
        logger.error("No implementation code to check.", {
          step: "RUN_TYPE_CHECK_ERROR",
          eventId,
        })
        return {
          status: "FAILED",
          message: "Type check failed: No implementation code provided",
          errors: ["No implementation code provided"],
        }
      }
      typeCheckResult = await step.run("run-type-check", async () => {
        logger.info("Running type check")
        return await runTypeCheck(logger, eventId, codeToCheck)
      })

      logger.info("Type check result: success=" + typeCheckResult.success, {
        eventId,
      })

      if (!typeCheckResult.success) {
        logger.error(
          "Type check failed with errors: " +
            (typeCheckResult.errors || "none"),
          {
            eventId,
          }
        )
        return {
          status: "FAILED",
          message: "Type check failed",
          errors: typeCheckResult.errors,
        }
      }

      // 6.2.1 Run Tests if Type Check is successful
      if (typeCheckResult.success && finalState.status === "NEEDS_TYPE_CHECK") {
        logger.info("Running tests for generated code.", {
          step: "RUN_TESTS_START",
          eventId,
        })
        const testFilePath = finalState.test_code ? "path/to/test/file" : ""
        if (!testFilePath) {
          logger.error("No test file path provided.", {
            step: "RUN_TESTS_ERROR",
            eventId,
          })
          return {
            status: "FAILED",
            message: "Test run failed: No test file path provided",
            errors: ["No test file path provided"],
          }
        }
        const testResult = await step.run("run-tests", async () => {
          logger.info("Running tests")
          return await runVitest(logger, eventId, testFilePath)
        })

        logger.info("Test result: success=" + testResult.success, {
          eventId,
        })

        if (!testResult.success) {
          logger.error(
            "Tests failed with errors: " + (testResult.errors || "none"),
            {
              eventId,
            }
          )
          return {
            status: "FAILED",
            message: "Tests failed",
            errors: testResult.errors,
          }
        }
        finalState.status = "NEEDS_TEST_CRITIQUE"
      }
    }

    // 6.3 Run the Agent Network for Critic if status is NEEDS_IMPLEMENTATION_CRITIQUE
    let criticResult = null
    if (finalState.status === "NEEDS_IMPLEMENTATION_CRITIQUE") {
      logger.info("Starting agent network run for Critic.", {
        step: "NETWORK_RUN_CRITIC_START",
        eventId,
        status: finalState.status,
      })
      criticResult = await step.run("run-agent-network-critic", async () => {
        logger.info("Running agent network for Critic")
        return await network.run(`Coding task for event ${eventId}`)
      })

      const stateAfterCritic =
        criticResult.state && criticResult.state.data
          ? criticResult.state.data.status || "UNKNOWN"
          : "UNKNOWN"
      logger.info("State after Critic run: " + stateAfterCritic, {
        eventId,
      })

      return { status: stateAfterCritic, message: "Completed Critic review" }
    }

    // 7. Log Final State and Return
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
