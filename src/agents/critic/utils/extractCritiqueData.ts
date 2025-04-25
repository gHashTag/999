import type { AgentResult, Message } from "@inngest/agent-kit"
import type { CritiqueData, LoggerFunc } from "../../../types/agents"

// Define a more specific type for the expected structure of the last message
// This helps TypeScript understand the possible properties
// We assume the relevant message has role 'assistant'
interface AssistantMessage {
  role?: "assistant" | string // Role might not always be exactly 'assistant'
  type?: "text" | "tool_call" | string // Allow other string types but prioritize known ones
  content?: string | object | null // content can be string, object, or null
}

/**
 * Extracts critique data from an agent's result.
 * Improved type checking for message content.
 */
export function extractCritiqueData(
  result: AgentResult | undefined,
  log: LoggerFunc
): CritiqueData {
  if (!result) return { error: "Agent result is missing." }
  let outputText = ""

  // Check if output is an array of messages (standard structure)
  if (Array.isArray(result.output) && result.output.length > 0) {
    const lastMessage = result.output[result.output.length - 1] as Message // Assert as base Message

    // Handle different message types within the last message
    if (lastMessage?.role === "assistant") {
      // Now we know it's an assistant message, assert the more specific type
      const assistantMessage = lastMessage as AssistantMessage

      if (assistantMessage.type === "text") {
        // Ensure content is a string for text messages
        if (typeof assistantMessage.content === "string") {
          outputText = assistantMessage.content
        } else {
          // Handle potentially structured content within text message if needed
          outputText = String(assistantMessage.content ?? "")
          log(
            "warn",
            "extractCritiqueData",
            "TextMessage content was not a simple string, converted.",
            { content: assistantMessage.content }
          )
        }
      } else if (assistantMessage.type === "tool_call") {
        log(
          "warn",
          "extractCritiqueData",
          "Last message was tool_call, critique extraction might be incomplete.",
          { lastMessage: assistantMessage } // Use asserted type
        )
        outputText = "[Assistant called a tool]" // Placeholder text
      } else {
        // Handle other potential types if necessary, or log unexpected type
        const unknownType = assistantMessage.type || "unknown"
        log(
          "warn",
          "extractCritiqueData",
          `Unexpected message type '${unknownType}' in last assistant message.`,
          { lastMessage: assistantMessage } // Use asserted type
        )
        // Attempt to stringify content as fallback, checking if content exists
        try {
          outputText =
            assistantMessage.content !== undefined
              ? JSON.stringify(assistantMessage.content)
              : "[No Content]"
        } catch {
          outputText = "[Unstringifyable Content]"
        }
      }
    } else {
      // Log if the last message wasn't from the assistant
      log(
        "warn",
        "extractCritiqueData",
        "Last message was not from assistant role.",
        { lastMessage }
      )
      // Attempt to stringify the whole message as a fallback
      try {
        outputText = JSON.stringify(lastMessage)
      } catch {
        outputText = "[Unstringifyable Message]"
      }
    }
  } else if (typeof result.output === "string") {
    // Handle cases where output might just be a string
    outputText = result.output
    log("warn", "extractCritiqueData", "Agent output was a direct string.", {
      output: result.output,
    })
  } else {
    // Final fallback if output structure is completely unexpected
    log("error", "extractCritiqueData", "Unexpected agent output format.", {
      output: result.output,
    })
    try {
      outputText = JSON.stringify(result.output) || "[Empty/Invalid Output]"
    } catch {
      outputText = "[Unstringifyable Output]"
    }
  }

  const critiqueLower = outputText.toLowerCase()

  const needsRevision =
    critiqueLower.includes("revision") ||
    critiqueLower.includes("issue") ||
    critiqueLower.includes("error") || // Be careful this doesn't catch agent errors themselves
    critiqueLower.includes("fix") ||
    critiqueLower.includes("problem")
  const isApproved =
    critiqueLower.includes("approved") ||
    critiqueLower.includes("ok") ||
    critiqueLower.includes("looks good") ||
    critiqueLower.includes("lgtm")

  // Avoid triggering revision if it's just reporting an agent/tool error message
  const likelyErrorMessage =
    (critiqueLower.includes("error:") || critiqueLower.includes("failed:")) &&
    !critiqueLower.includes("no error") // Add exclusion for phrases like "no error"

  if (likelyErrorMessage && !isApproved) {
    // If it looks like an error message and not explicitly approved, treat as error
    return { error: `Critic agent output indicates error: ${outputText}` }
  }

  // If both flags are somehow true (e.g., "revision approved"), approval wins.
  if (isApproved) {
    return { critique: outputText, isApproved: true, needsRevision: false }
  } else if (needsRevision) {
    return { critique: outputText, needsRevision: true, isApproved: false }
  } else {
    // Ambiguous case - neither approval nor revision keywords found.
    // Let's default to needing revision if unclear, but log warning.
    log(
      "warn",
      "extractCritiqueData",
      "Ambiguous critique, defaulting to needsRevision=true",
      { outputText }
    )
    return {
      critique: outputText,
      needsRevision: true,
      isApproved: false,
      // error: "Ambiguous critique", // Optionally mark as ambiguous error
    }
  }
}
