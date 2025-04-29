/* eslint-disable @typescript-eslint/no-explicit-any */

import { createNetwork, /*Agent,*/ type NetworkRun } from "@inngest/agent-kit"
// import { deepseek } from "@inngest/ai/models"
import { TddNetworkState } from "@/types/network" // Remove unused NetworkStatus
// Remove direct import of log
// import { log as defaultLog } from "@/utils/logic/logger"
// Import router logic functions
// Remove unused imports from routerLogic
import {
  // parseAndInitializeState,
  // chooseNextAgent,
  // saveStateToKv,
  defaultRouter, // Import the defaultRouter function itself
} from "./routerLogic"
// Remove unused Agents import
import { /*type Agents,*/ type AgentDependencies } from "@/types/agents" // Import Agents and AgentDependencies

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

// Updated createDevOpsNetwork to accept dependencies
export function createDevOpsNetwork(dependencies: AgentDependencies) {
  const { agents, model: defaultModel, log } = dependencies // Destructure dependencies

  // Ensure all required agents are present by checking the input 'agents' object
  if (
    !agents?.teamLead ||
    !agents?.tester ||
    !agents?.coder ||
    !agents?.critic ||
    !agents?.tooling
  ) {
    throw new Error(
      "Missing one or more required agents (teamLead, tester, coder, critic, tooling) in dependencies.agents object."
    )
  }

  const network = createNetwork<TddNetworkState>({
    name: "TeamLead TDD DevOps Network",
    // Pass agents from the 'agents' object in dependencies as an array
    agents: [
      agents.teamLead,
      agents.tester,
      agents.coder,
      agents.critic,
      agents.tooling,
    ],
    defaultModel: defaultModel, // Pass the model from dependencies
    // Pass the router function, wrapping it to inject the logger
    router: async ({ network }) => {
      // Call the imported defaultRouter, passing the logger from dependencies
      return defaultRouter({ network, log })
    },
    maxIter: 25,
    // defaultRouter property is removed as router is now provided
    // defaultRouter: async ({ network }) => { ... } // Original inline router removed
  })

  // --- Remove agent tools check log ---
  // console.log("[createDevOpsNetwork] Checking tools on created agents:", {
  // });
  // ------------------------------------

  return network
}

export { type NetworkRun } // Re-export NetworkRun type
