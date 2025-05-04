/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  type NetworkRun,
  createNetwork, // Keep createNetwork factory
  type Network, // Keep Network type
  // AgentNetwork, // REMOVED UNUSED
} from "@inngest/agent-kit"
// Keep deepseek import
// import { deepseek } from "@inngest/ai/models"
// Use mock adapter from the corrected testSetup
import { mockDeepseekModelAdapter } from "@/__tests__/setup/testSetup"
// Import router logic functions if needed, otherwise remove
// import { defaultRouter } from "./routerLogic" // REMOVED UNUSED
import type { AgentDependencies } from "@/types/agents"
import { TddNetworkState /*, NetworkStatus*/ } from "@/types/network" // REMOVED UNUSED NetworkStatus
/* // REMOVED UNUSED IMPORT BLOCK
import {
  createTesterAgent,
  createToolingAgent,
} from "@/definitions/agentDefinitions"
*/

/**
 * Creates the DevOps agent network.
 */
export function createDevOpsNetwork(
  dependencies: AgentDependencies
): Network<TddNetworkState> {
  // Use Network type
  const { log } = dependencies

  log.info("Creating DevOps network instance...", {
    step: "NETWORK_CREATE_START",
  })

  const networkOptions = {
    name: "tdd-network",
    kvPrefix: "tddNetwork",
    state: {
      initial: {
        status: "READY",
        task: "Initial task placeholder",
        test_requirements: undefined,
        test_code: undefined,
        implementation_code: undefined,
        critique: undefined,
        command_to_execute: undefined,
        last_command_output: undefined,
        first_failing_test: undefined,
        sandboxId: undefined,
        run_id: dependencies.eventId,
      },
    },
    router: undefined,
    dependencies: dependencies,
    agents: dependencies.agents ? Object.values(dependencies.agents) : [],
    // Use the imported mock adapter, ensure it aligns with expected type
    defaultModel: mockDeepseekModelAdapter as any, // Cast if necessary
  }

  // Use createNetwork factory
  const network = createNetwork<TddNetworkState>(networkOptions)

  log.info("DevOps network instance created.", { step: "NETWORK_CREATE_END" })

  return network
}

export { type NetworkRun } // Re-export NetworkRun type
