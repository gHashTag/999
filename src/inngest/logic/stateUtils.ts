// import { CodingAgentEvent } from "@/types/events" // Removed
import { type TddNetworkState, NetworkStatus } from "@/types/network"
// import { type CodingAgentEventData } from "@/types/events" // REMOVED
import { HandlerLogger } from "@/types/agents"
import { CodingAgentEvent } from "@/types/events" // We need this for the data type
import { HandlerStepName } from "@/types/handlerSteps"
// import { type Context } from "inngest"
import type { KvStore } from "@/types/agents"

// Use the actual return type of validateEventData
type ValidatedDataType = CodingAgentEvent["data"]

export function initializeOrRestoreState(
  validatedEventData: ValidatedDataType,
  sandboxId: string,
  logger: HandlerLogger,
  eventId: string
): TddNetworkState {
  if (
    validatedEventData.currentState &&
    validatedEventData.currentState.sandboxId === sandboxId // Ensure consistency
  ) {
    logger.info(
      "Restoring existing state from event data.",
      { step: "STATE_RESTORED" },
      {
        eventId,
        restoredStatus: validatedEventData.currentState.status,
        sandboxId,
      }
    )
    // Restore the state without the flag
    return {
      ...validatedEventData.currentState,
    }
  } else {
    logger.info(
      "Initializing new state.",
      { step: "STATE_INITIALIZED" },
      {
        eventId,
        initialTask: validatedEventData.input,
        sandboxId,
      }
    )
    return {
      task: validatedEventData.input,
      status: NetworkStatus.Enum.NEEDS_REQUIREMENTS_CRITIQUE,
      sandboxId,
      run_id: eventId,
    }
  }
}

/** Function to get the current state, either from KV or initialize */
export const getCurrentState = async (
  logger: HandlerLogger,
  kvStore: KvStore | undefined,
  initialTask: string | undefined,
  eventId: string
): Promise<TddNetworkState | null> => {
  if (!kvStore) {
    logger.error("KV store not available (checked again inside async).", {
      step: HandlerStepName.HANDLER_ERROR,
      eventId,
    })
    return null
  }

  let state: TddNetworkState | null | undefined = null // Initialize state
  if (kvStore) {
    // FIX: Use non-null assertion again as TS struggles with async context
    // FIX: Add @ts-expect-error as a last resort for this specific TS limitation
    // @ts-expect-error KV check done earlier, TS struggles with async context
    state = (await kvStore!.all()) as TddNetworkState | null | undefined
  } else {
    logger.error(
      "KV store was unexpectedly undefined just before .all() call",
      { step: HandlerStepName.HANDLER_ERROR, eventId }
    )
  }

  if (state && Object.keys(state).length > 0) {
    logger.info("Restored state from KV store.", { step: "STATE_RESTORED" })
    return state
  } else {
    if (!initialTask) {
      logger.error(
        "Cannot initialize state: Initial task description is missing.",
        { step: "STATE_INIT_FAIL_NO_TASK", eventId }
      )
      return null
    }
    logger.info(
      "Initializing new state.",
      { step: "STATE_INITIALIZED" },
      { eventId, initialTask }
    )
    const newState: TddNetworkState = {
      status: NetworkStatus.Enum.READY,
      task: initialTask,
      sandboxId: undefined,
      run_id: eventId,
    }
    for (const [key, value] of Object.entries(newState)) {
      if (value !== undefined) {
        await kvStore.set(key, value)
      }
    }
    return newState
  }
}

/** Function to log the final state */
export const logFinalResult = (
  finalState: TddNetworkState | null,
  logger: HandlerLogger
): void => {
  if (finalState) {
    const loggedState = { ...finalState }
    delete (loggedState as any).test_code
    delete (loggedState as any).implementation_code
    logger.info("Final state:", {
      step: HandlerStepName.HANDLER_COMPLETED,
      state: loggedState,
    })
  } else {
    logger.error("Final state is null.", {
      step: HandlerStepName.HANDLER_FINAL_STATE_MISSING,
    })
  }
}
