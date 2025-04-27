/* eslint-disable @typescript-eslint/no-explicit-any */

import { createNetwork, Agent, type NetworkRun } from "@inngest/agent-kit"
// import { deepseek } from "@inngest/ai/models"
import { TddNetworkState } from "@/types/network" // Remove unused NetworkStatus
import { log } from "@/utils/logic/logger" // Corrected import to 'log'
// Import router logic functions
import {
  parseAndInitializeState,
  chooseNextAgent,
  saveStateToKv,
} from "./routerLogic"
import { type Agents } from "@/types/agents" // Import Agents type
import { defaultRouter } from "./routerLogic" // Correct path

// Define the Network States for TDD flow with Critique Loop
/*
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
*/

// Define the structure of the state KV store with critique fields
/*
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
*/

// FIX: Use Agent type for function parameters and add defaultModel
export function createDevOpsNetwork(
  teamLeadAgent: Agent<any>,
  testerAgent: Agent<any>,
  codingAgent: Agent<any>,
  criticAgent: Agent<any>,
  toolingAgent: Agent<any>,
  defaultModel: any // Use any for ModelAdapter
) {
  const router: any = defaultRouter // Use imported defaultRouter

  const network = createNetwork<TddNetworkState>({
    name: "TeamLead TDD DevOps Network",
    agents: [
      teamLeadAgent,
      testerAgent,
      codingAgent,
      criticAgent,
      toolingAgent,
    ],
    // defaultModel: deepseek({
    //   apiKey: process.env.DEEPSEEK_API_KEY!,
    //   model: process.env.DEEPSEEK_MODEL || "deepseek-coder",
    // }),
    defaultModel: defaultModel, // Pass the model
    router: router, // Pass the router
    maxIter: 25,
    defaultRouter: async ({ network }) => {
      const routerIterationStart = Date.now() // Timestamp for iteration start
      log("info", "ROUTER_ITERATION_START", "Router iteration starting.", {
        iterationStart: routerIterationStart,
      })

      const state = parseAndInitializeState(network)
      const currentSandboxId = state.sandboxId || null

      const agents: Agents = {
        teamLead: teamLeadAgent as Agent<TddNetworkState>,
        tester: testerAgent as Agent<TddNetworkState>,
        coder: codingAgent as Agent<TddNetworkState>,
        critic: criticAgent as Agent<TddNetworkState>,
        tooling: toolingAgent as Agent<TddNetworkState>,
      }
      const nextAgent = chooseNextAgent(state, agents)

      saveStateToKv(network, state)

      const routerIterationEnd = Date.now() // Timestamp for iteration end
      log("info", "ROUTER_ITERATION_END", "Router iteration finished.", {
        chosenAgent: nextAgent?.name || "None (Stopping)",
        finalStatusInIteration: state?.status,
        durationMs: routerIterationEnd - routerIterationStart,
        sandboxId: currentSandboxId, // Include sandboxId in final log
      })

      return nextAgent // Return the chosen agent (or undefined to stop)
    },
  })

  // --- Remove agent tools check log ---
  // console.log("[createDevOpsNetwork] Checking tools on created agents:", {
  // });
  // ------------------------------------

  return network
}

export { type NetworkRun } // Re-export NetworkRun type
