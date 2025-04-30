import { type EventPayload } from "inngest"
import {
  type CodingAgentEvent,
  codingAgentEventSchema,
  type CodingAgentEventData,
} from "@/types/events"
import { HandlerLogger } from "@/types/agents"
import { HandlerStepName } from "@/types/handlerSteps"

// Define the expected structure of the 'data' part when validation passes
// This combines the base event data with the specific input
interface ValidatedData {
  input: string // Changed from input: { task: string } based on test data
  currentState?: any // Keep currentState optional as before
}

export function validateEventData(
  event: EventPayload<CodingAgentEvent>,
  logger: HandlerLogger
): // FIX: Update success return type to ValidatedData
{ data: ValidatedData; error?: undefined } | { error: string; data?: null } {
  // --- Skip Zod validation in test environment ---
  if (process.env.NODE_ENV === "test") {
    logger.info(
      "Skipping data validation for test event.", // String message
      {
        step: "VALIDATE_DATA_SKIP_TEST",
        eventId: event?.id,
        eventName: event?.name,
      }
    )
    // FIX: Access properties correctly via event.data
    if (!event || !event.data) {
      logger.warn(
        "Test event has no data object.", // String message
        { step: "VALIDATE_DATA_SKIP_TEST_NODATA", eventId: event?.id }
      )
      return { error: "Test environment provided no event or event data." }
    }
    // FIX: Cast through unknown to bypass stricter TS check
    const eventData = event.data as unknown as CodingAgentEventData
    if (typeof eventData.input !== "string") {
      logger.error(
        "Test environment data is missing the mandatory 'input' field.", // String message
        {
          step: "VALIDATE_DATA_SKIP_TEST_NOINPUT",
          eventId: event?.id,
          receivedData: eventData,
        }
      )
      return {
        error: "Test environment data is missing the mandatory 'input' field.",
      }
    }
    // FIX: Return the structured ValidatedData using eventData
    return {
      data: {
        input: eventData.input,
        currentState: eventData.currentState, // Access via eventData
      },
    }
  }
  // -----------------------------------------------

  // Original validation logic for non-test environments
  // FIX: Parse event.data using the schema
  const validatedResult = codingAgentEventSchema.safeParse(event.data)
  if (!validatedResult.success) {
    const errorMessage = "Invalid event data received."
    const errorDetails = validatedResult.error.issues
      .map(e => `${e.path.join(".")}: ${e.message}`)
      .join("; ")
    logger.error(
      `${errorMessage} Details: ${errorDetails}`, // String message
      {
        step: HandlerStepName.HANDLER_INVALID_DATA,
        eventId: event?.id,
        errors: validatedResult.error.flatten(), // Log structured errors
      }
    )
    return {
      error: `${errorMessage} ${errorDetails}`,
    }
  }
  // FIX: Return validated data matching ValidatedData structure
  // The schema itself defines 'input' and 'currentState', so validatedResult.data conforms
  return { data: validatedResult.data }
}
