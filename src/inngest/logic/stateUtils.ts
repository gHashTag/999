// import { CodingAgentEvent } from "@/types/events" // Removed
import { type TddNetworkState, NetworkStatus } from "@/types/network"
// import { type CodingAgentEventData } from "@/types/events" // REMOVED
import { HandlerLogger } from "@/types/agents"
import { CodingAgentEvent } from "@/types/events" // We need this for the data type
// import { HandlerStepName } from "@/types/handlerSteps" // REMOVED

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
      { step: "STATE_RESTORED" },
      "Restoring existing state from event data.",
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
    logger.info({ step: "STATE_INITIALIZED" }, "Initializing new state.", {
      eventId,
      initialTask: validatedEventData.input,
      sandboxId,
    })
    return {
      task: validatedEventData.input,
      status: NetworkStatus.Enum.NEEDS_REQUIREMENTS_CRITIQUE,
      sandboxId,
    }
  }
}
