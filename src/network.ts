import { createNetwork, Agent } from "@inngest/agent-kit"
import { deepseek } from "@inngest/ai/models"
import { z } from "zod"

// Define the Network States for TDD flow with Critique Loop
const NetworkStatus = z.enum([
  "NEEDS_TEST", // Initial state: Tester needs to write tests
  "NEEDS_TEST_CRITIQUE", // Critic needs to review the tests
  "NEEDS_TEST_REVISION", // Tester needs to revise tests based on critique
  "NEEDS_CODE", // Tests approved: Coder needs to write implementation
  "NEEDS_CODE_CRITIQUE", // Critic needs to review the code
  "NEEDS_CODE_REVISION", // Coder needs to revise code based on critique
  "COMPLETED", // Code approved: Cycle finished
])
type NetworkStatus = z.infer<typeof NetworkStatus>

// Define the structure of the state KV store with critique fields
interface NetworkState {
  task: string
  status: NetworkStatus
  sandboxId?: string // Keep sandboxId in state
  test_code?: string
  current_code?: string
  test_critique?: string // Feedback on tests from critic
  code_critique?: string // Feedback on code from critic
  critique?: string
}

// FIX: Use Agent type for function parameters
export function createDevOpsNetwork(
  testerAgent: Agent<any>,
  codingAgent: Agent<any>,
  criticAgent: Agent<any>
) {
  const network = createNetwork({
    name: "TDD DevOps Team with Critique",
    agents: [testerAgent, codingAgent, criticAgent],
    defaultModel: deepseek({
      apiKey: process.env.DEEPSEEK_API_KEY!,
      model: process.env.DEEPSEEK_MODEL || "deepseek-coder",
    }),
    maxIter: 25, // Increased max iterations for potential revisions
    // TDD Router Logic with Critique Loop
    defaultRouter: async ({ network }) => {
      const state = (network?.state?.kv?.get("network_state") || {
        status: "NEEDS_TEST",
      }) as NetworkState

      console.log(`[Router] Current state status: ${state.status}`)

      switch (state.status) {
        case "NEEDS_TEST":
        case "NEEDS_TEST_REVISION": // Tester works in both cases
          console.log("[Router] Routing to Tester Agent.")
          return testerAgent

        case "NEEDS_CODE":
        case "NEEDS_CODE_REVISION": // Coder works in both cases
          console.log("[Router] Routing to Coding Agent.")
          return codingAgent

        case "NEEDS_TEST_CRITIQUE":
        case "NEEDS_CODE_CRITIQUE": // Critic works in both cases
          console.log("[Router] Routing to Critic Agent.")
          return criticAgent

        case "COMPLETED":
          console.log("[Router] Task completed. Stopping.")
          return

        default:
          console.error(
            `[Router] Unknown or unhandled status: ${state.status}. Stopping.`
          )
          return
      }
    },
  })
  return network
}
