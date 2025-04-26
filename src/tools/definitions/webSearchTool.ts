import { createTool, type Tool } from "@inngest/agent-kit"
import { z } from "zod"
import type { LoggerFunc } from "@/types/agents"
import type { TddNetworkState } from "@/types/network"

export const webSearchParamsSchema = z.object({
  search_term: z.string().describe("The term or query to search on the web."),
})

/**
 * Creates the definition for the web_search tool.
 * @param log - The logging function.
 * @param eventId - The current event ID.
 * @returns The web_search tool instance.
 */
export function createWebSearchTool(
  log: LoggerFunc,
  eventId: string
  // Potentially add a web search client/function dependency here
) {
  return createTool({
    name: "web_search",
    description:
      "Search the web for real-time information about any topic. Use this tool when you need up-to-date information.",
    parameters: webSearchParamsSchema,
    handler: async (
      params: z.infer<typeof webSearchParamsSchema>,
      opts: Tool.Options<TddNetworkState>
    ) => {
      log(
        "info",
        "TOOL_WEB_SEARCH_START",
        `Starting web search for: ${params.search_term}`,
        {
          eventId,
          sandboxId: opts.network.state.kv.get("sandboxId"),
          searchTerm: params.search_term,
        }
      )

      try {
        // Placeholder for actual web search logic
        // const searchResults = await performWebSearch(params.search_term);
        const searchResults = [
          {
            title: "Placeholder Result 1",
            snippet: "This is a placeholder snippet for the search term.",
            url: "http://example.com/result1",
          },
          {
            title: "Placeholder Result 2",
            snippet: "Another placeholder demonstrating the structure.",
            url: "http://example.com/result2",
          },
        ]

        log(
          "info",
          "TOOL_WEB_SEARCH_SUCCESS",
          "Web search completed successfully.",
          {
            eventId,
            sandboxId: opts.network.state.kv.get("sandboxId"),
            resultCount: searchResults.length,
          }
        )
        return JSON.stringify(searchResults) // Return results as a JSON string
      } catch (error: unknown) {
        let errorMessage = "Unknown web search error"
        if (error instanceof Error) {
          errorMessage = error.message
        } else if (typeof error === "string") {
          errorMessage = error
        }

        log("error", "TOOL_WEB_SEARCH_ERROR", "Error during web search", {
          eventId,
          sandboxId: opts.network.state.kv.get("sandboxId"),
          error: errorMessage,
        })
        throw new Error(`Web search failed: ${errorMessage}`)
      }
    },
  })
}
