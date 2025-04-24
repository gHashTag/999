import { createNetwork } from "@inngest/agent-kit"
// @ts-ignore - Temporarily ignore module resolution error - REMOVED
import { deepseek } from "@inngest/ai/models"
// Define the Network
export function createDevOpsNetwork(codingAgent: any, refactoringAgent: any) {
  const network = createNetwork({
    name: "DevOps team",
    agents: [codingAgent, refactoringAgent],
    defaultModel: deepseek({
      // Model for the router itself
      apiKey: process.env.DEEPSEEK_API_KEY!,
      model: process.env.DEEPSEEK_MODEL || "deepseek-coder",
    }),
    maxIter: 15,
    // Improved Router Logic
    defaultRouter: async ({ network }: any) => {
      const net = network || { state: { _messages: [], kv: new Map() } } // Assume _messages might exist

      // If task is already summarized, stop routing
      if (net.state.kv.has("task_summary")) return

      // Attempt to get the initial user input from the message history
      // Note: Accessing _messages is speculative based on potential internal structure
      const initialPrompt =
        net.state._messages?.[0]?.content?.toLowerCase() || ""
      console.log(
        `[Router] Initial prompt detected (lowercase): "${initialPrompt.substring(0, 100)}..."`
      ) // Log for debugging

      // Keywords for refactoring tasks
      const refactoringKeywords = [
        "refactor",
        "improve",
        "clean up",
        "optimize",
        "readability",
      ]

      // Check if the initial prompt contains any refactoring keywords
      const isRefactoringTask = refactoringKeywords.some(keyword =>
        initialPrompt.includes(keyword)
      )

      if (isRefactoringTask) {
        console.log("[Router] Routing to Refactoring Agent based on keywords.")
        return refactoringAgent
      } else {
        console.log("[Router] Defaulting to Coding Agent.")
        return codingAgent
      }
    },
  })
  return network
}
