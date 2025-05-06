// import { type Context } from "inngest"
import { createDevOpsNetwork } from "@/network/network"
import { type AgentDependencies } from "@/types/agents"
// import { type AllProjectEvents } from "@/types/events"
import { HandlerStepName } from "@/types/handlerSteps"
import { NetworkStatus, type TddNetworkState } from "@/types/network"
import {
  createAgentDependencies,
  getCurrentState,
  logFinalResult,
  validateEventData,
} from "@/inngest/logic/commonLogic"
import { executeTddCycleLogic } from "./logic/tddCycleLogic"
import { contentFactoryWorkflow } from "./functions/contentFactoryWorkflow"
import { runTypeCheckFunction } from "./functions/runTypeCheck"
import { runVitestFunction } from "./functions/runVitest"
import { inngest } from "./client"

// const mockLoggerInstance: BaseLogger = consola.withTag("MockInngestRun")
const MAX_REVISION_ATTEMPTS = 3

export const runCodingAgent = inngest.createFunction(
  {
    id: HandlerStepName.RUN_CODING_AGENT,
    name: "TDD Coding Agent Executor",
    cancelOn: [
      {
        event: "app/cancel.run.requested",
        if: "async ({ event }) => event.data.runId === async ({ event }) => event.data.runId",
      },
    ],
  },
  { event: "coding-agent/run" as const },
  async ({ event, step, logger }: any) => {
    const eventIdFromEventData = event.data.eventId

    logger.info("Coding Agent v3 started.", {
      eventId: eventIdFromEventData,
      step: HandlerStepName.HANDLER_ENTERED,
    })

    const validated = validateEventData(
      event.data,
      eventIdFromEventData,
      logger
    )
    if (!validated.data) {
      logger.error("Event data validation failed.", {
        eventId: eventIdFromEventData,
        error: validated.error,
      })
      return {
        success: false,
        message: validated.error || "Validation failed",
        error: validated.error,
      }
    }
    const {
      input: taskDescription,
      eventId: validatedEventId,
      currentState: initialCurrentState,
    } = validated.data

    const currentSandboxId = initialCurrentState?.sandboxId ?? undefined

    const agentDeps: AgentDependencies = createAgentDependencies(
      logger,
      undefined,
      undefined,
      undefined,
      currentSandboxId
    )

    const devOpsNetwork = createDevOpsNetwork(agentDeps)

    let currentState = await getCurrentState(
      initialCurrentState,
      logger,
      validatedEventId,
      currentSandboxId
    )

    if (!currentState || !currentState.status) {
      currentState = {
        ...currentState,
        status: NetworkStatus.Enum.NEEDS_CODE,
        task_description: taskDescription,
        eventId: validatedEventId,
      }
      logger.info(
        `Initial status set to NEEDS_CODE for event ${validatedEventId}`,
        { currentState }
      )
      if (agentDeps.kv) {
        await agentDeps.kv.set("network_state", currentState)
      }
    }

    let finalState: Partial<TddNetworkState>
    try {
      finalState = await executeTddCycleLogic({
        initialState: currentState,
        agentDeps,
        network: devOpsNetwork,
        step,
        logger,
        validatedEventId,
        initialTaskDescription: taskDescription,
        sandboxId: currentSandboxId,
        maxRevisionAttempts: MAX_REVISION_ATTEMPTS,
      })
    } catch (error: unknown) {
      let errorMessage = "Unknown error occurred during TDD cycle execution."
      if (error instanceof Error) {
        errorMessage = error.message
      }
      logger.error("Error during TDD cycle execution.", {
        eventId: validatedEventId,
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      })
      finalState = {
        ...currentState,
        status: NetworkStatus.Enum.FAILED,
        error: `TDD Cycle Error: ${errorMessage}`,
      }
    }

    await logFinalResult(finalState, logger, validatedEventId)

    const resultMessage = finalState.error
      ? `Finished with error: ${finalState.error}`
      : `Finished with status: ${finalState.status}`

    logger.info(`Coding Agent v3 finished. ${resultMessage}`, {
      eventId: validatedEventId,
      step: HandlerStepName.HANDLER_COMPLETED,
      finalStatus: finalState.status,
    })

    return {
      success:
        !finalState.error && finalState.status === NetworkStatus.Enum.COMPLETED,
      message: resultMessage,
      data: { eventId: validatedEventId, finalState: finalState },
    }
  }
)

export const functions = [
  runCodingAgent,
  contentFactoryWorkflow,
  runTypeCheckFunction,
  runVitestFunction,
]
