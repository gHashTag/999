import type { AgentResult } from "@inngest/agent-kit"
import { HandlerLogger, type CritiqueData } from "@/types/agents"

/**
 * Extracts critique data from an agent's result.
 * Improved type checking for message content.
 */
export function extractCritiqueData(
  result: AgentResult | undefined,
  log: HandlerLogger
): CritiqueData {
  if (!result) {
    log.error("extractCritiqueData", "Agent result is missing.")
    return { error: "Agent result is missing." }
  }

  if (!result.output || result.output.length === 0) {
    log.warn("extractCritiqueData", "Agent output is empty.")
    return { error: "Agent output is empty." }
  }

  // Assuming the critique is in the last message
  const lastMessage = result.output[result.output.length - 1]

  if (lastMessage.type !== "text") {
    log.warn("extractCritiqueData", "Last agent message is not text.", {
      type: lastMessage.type,
    })
    return { error: "Last agent message is not text." }
  }

  // FIX: Check if content is a string before trimming
  let content = ""
  if (typeof lastMessage.content === "string") {
    content = lastMessage.content.trim()
  } else {
    // Handle non-string content (e.g., array of TextContent)
    log.warn(
      "extractCritiqueData",
      "Last message content was not a string, converting.",
      { contentType: typeof lastMessage.content }
    )
    // Attempt to stringify or join if it's an array
    try {
      content = Array.isArray(lastMessage.content)
        ? lastMessage.content.map(c => c.text || "").join(" ") // Example for TextContent[]
        : JSON.stringify(lastMessage.content)
    } catch (e) {
      content = "[Unprocessable Content]"
      log.error("extractCritiqueData", "Failed to process non-string content", {
        error: e,
      })
    }
    content = content.trim() // Trim the processed content
  }

  // Try to parse JSON
  if (content.startsWith("```json") && content.endsWith("```")) {
    const jsonString = content.substring(7, content.length - 3).trim()
    try {
      const parsedJson = JSON.parse(jsonString)
      log.info("extractCritiqueData", "Successfully parsed JSON response.", {
        parsedJson,
      })
      // Validate parsed structure (basic check)
      if (typeof parsedJson.approved === "boolean") {
        return {
          isApproved: parsedJson.approved,
          critique: parsedJson.critique || "",
          // refactored_code: parsedJson.refactored_code || null, // Assuming this field exists
        }
      } else {
        log.error(
          "extractCritiqueData",
          "Parsed JSON missing required fields.",
          { parsedJson }
        )
        return { error: "Parsed JSON missing required fields." }
      }
    } catch (error) {
      log.error("extractCritiqueData", "Failed to parse JSON response.", {
        error,
        jsonString,
      })
      return { error: "Failed to parse JSON response." }
    }
  }

  // Handle non-JSON responses (assume direct critique text)
  log.warn("extractCritiqueData", "Agent output was a direct string.", {
    content,
  })
  // Heuristic: Assume it's a negative critique if it doesn't contain common positive keywords
  const isLikelyApproved = ["approved", "lgTM", "looks good"].some(keyword =>
    content.toLowerCase().includes(keyword)
  )

  return {
    critique: content,
    isApproved: isLikelyApproved, // Best guess
  }
  /* // Original complex logic - replaced by simpler JSON check
  // ... existing logic ...
  */
}
