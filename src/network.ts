import { createNetwork, Agent } from "@inngest/agent-kit"
import { deepseek } from "@inngest/ai/models"
import { z } from "zod"

// Define the Network States for TDD flow
const NetworkStatus = z.enum([
  "NEEDS_TEST",
  "NEEDS_CODE",
  "NEEDS_CRITIQUE",
  "COMPLETED",
])
type NetworkStatus = z.infer<typeof NetworkStatus>

// Define the structure of the state KV store
interface NetworkState {
  task: string
  status: NetworkStatus
  test_code?: string
  current_code?: string
  critique?: string
}

// FIX: Use Agent type for function parameters
export function createDevOpsNetwork(
  testerAgent: Agent<any>, // Renamed from codingAgent, acts first
  codingAgent: Agent<any>, // New agent
  criticAgent: Agent<any> // New agent
) {
  const network = createNetwork({
    name: "TDD DevOps Team",
    agents: [testerAgent, codingAgent, criticAgent], // Added new agents
    defaultModel: deepseek({
      // Model for the router itself
      apiKey: process.env.DEEPSEEK_API_KEY!,
      model: process.env.DEEPSEEK_MODEL || "deepseek-coder",
    }),
    maxIter: 15,
    // TDD Router Logic based on state status
    defaultRouter: async ({ network }) => {
      // Ensure network and state exist
      const state = (network?.state?.kv?.get("network_state") || {
        status: "NEEDS_TEST", // Default if no state found (should be set by caller)
      }) as NetworkState

      console.log(`[Router] Current state status: ${state.status}`)

      switch (state.status) {
        case "NEEDS_TEST":
          console.log("[Router] Routing to Tester Agent.")
          return testerAgent
        case "NEEDS_CODE":
          console.log("[Router] Routing to Coding Agent.")
          return codingAgent
        case "NEEDS_CRITIQUE":
          console.log("[Router] Routing to Critic Agent.")
          return criticAgent
        case "COMPLETED":
          console.log("[Router] Task completed. Stopping.")
          return
        default:
          console.error(
            `[Router] Unknown status: ${state.status}. Defaulting to Tester.`
          )
          return testerAgent // Fallback, should not happen ideally
      }
    },
  })
  return network
}
