/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
import { createNetwork, Agent, type NetworkRun } from "@inngest/agent-kit"
import { deepseek } from "@inngest/ai/models"
import { TddNetworkState, NetworkStatus } from "@/types/network"
import { log } from "@/utils/logic/logger" // Corrected import to 'log'

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

// FIX: Use Agent type for function parameters
export function createDevOpsNetwork(
  teamLeadAgent: Agent<any>, // Add TeamLead Agent
  testerAgent: Agent<any>,
  codingAgent: Agent<any>, // Keep Coder for potential future use
  criticAgent: Agent<any>
) {
  const network = createNetwork({
    name: "TeamLead TDD DevOps Network", // Updated name
    // Add TeamLead to the list, Coder remains but might not be called by current router logic
    agents: [teamLeadAgent, testerAgent, codingAgent, criticAgent],
    defaultModel: deepseek({
      apiKey: process.env.DEEPSEEK_API_KEY!,
      model: process.env.DEEPSEEK_MODEL || "deepseek-coder",
    }),
    maxIter: 25, // Increased max iterations for potential revisions
    // Updated TDD Router Logic with TeamLead start
    defaultRouter: async ({ network }) => {
      // Use imported TddNetworkState type
      const state = (network?.state?.kv?.get("network_state") ||
        {
          // Initial state is now effectively set by TeamLead, router shouldn't need a default status
          // status: "NEEDS_TEST", // Removed default status assumption
        }) as TddNetworkState

      const currentStatus = state.status

      // Log the state *before* routing logic
      log("info", "ROUTER_START", `Status read from KV: ${currentStatus}`, {
        status: currentStatus,
      })

      let nextAgent: Agent<any> | undefined = undefined // Variable to store the chosen agent

      // --- Initial State Routing --- If status is missing, start with TeamLead
      if (!currentStatus) {
        log(
          "info",
          "ROUTER_NO_STATUS",
          "No status found, routing to TeamLead Agent initially."
        )
        nextAgent = teamLeadAgent
      } else {
        // --- Existing State Routing --- Based on the defined statuses
        switch (currentStatus) {
          case NetworkStatus.Enum.IDLE: // Handle IDLE state, perhaps route to TeamLead or stop
            log("info", "ROUTER_IDLE", "Status is IDLE. Stopping.", {
              status: currentStatus,
            })
            // Or route to TeamLead: nextAgent = teamLeadAgent;
            break // Added break for IDLE

          case NetworkStatus.Enum.NEEDS_TEST:
          case NetworkStatus.Enum.NEEDS_TEST_REVISION:
          case NetworkStatus.Enum.NEEDS_IMPLEMENTATION_REVISION: // Tester also handles implementation revision requests
            log(
              "info",
              "ROUTER_TO_TESTER",
              `Status is ${currentStatus}. Routing to Tester Agent.`,
              { status: currentStatus }
            )
            nextAgent = testerAgent
            break

          // case NetworkStatus.Enum.NEEDS_CODE: // Coder not directly called in this flow
          // case NetworkStatus.Enum.NEEDS_CODE_REVISION: // Handled by Tester generating new command
          //   log(
          //     "info",
          //     "ROUTER_TO_CODER",
          //     `Status is ${currentStatus}. Routing to Coding Agent.`,
          //     { eventId: network?.eventId, status: currentStatus }
          //   );
          //   nextAgent = codingAgent;
          //   break;

          case NetworkStatus.Enum.NEEDS_TEST_CRITIQUE:
          case NetworkStatus.Enum.NEEDS_COMMAND_VERIFICATION:
          case NetworkStatus.Enum.NEEDS_IMPLEMENTATION_CRITIQUE:
            log(
              "info",
              "ROUTER_TO_CRITIC",
              `Status is ${currentStatus}. Routing to Critic Agent.`,
              { status: currentStatus }
            )
            nextAgent = criticAgent
            break

          // Stop network loop when command execution is needed (handled by Handler)
          case NetworkStatus.Enum.NEEDS_COMMAND_EXECUTION:
            log(
              "info",
              "ROUTER_STOP_FOR_COMMAND",
              "Status is NEEDS_COMMAND_EXECUTION. Stopping agent network loop for handler execution."
            )
            // nextAgent remains undefined to stop the loop
            break

          // Stop network loop on completion or failure
          case NetworkStatus.Enum.COMPLETED:
          case NetworkStatus.Enum.FAILED:
            log(
              "info",
              "ROUTER_STOP_COMPLETED",
              `Task already ended with status: ${currentStatus}. Stopping.`,
              { status: currentStatus }
            )
            // nextAgent remains undefined to stop
            break

          case NetworkStatus.Enum.NEEDS_HUMAN_INPUT:
            log(
              "info",
              "ROUTER_STOP_FOR_HUMAN",
              "Status is NEEDS_HUMAN_INPUT. Stopping agent network loop for human interaction."
            )
            // nextAgent remains undefined to stop
            break

          default: {
            // This should now be truly exhaustive with the IDLE case handled
            // If the type system still complains, it might be a Zod/TS inference issue
            // const _exhaustiveCheck: never = currentStatus; // Keep commented for now
            log(
              "error",
              "ROUTER_UNKNOWN_STATUS",
              `Unknown or unhandled status: ${currentStatus}. Stopping.`,
              { status: currentStatus }
            )
            // nextAgent remains undefined to stop
            break
          }
        }
      }
      // Log the chosen agent (or undefined if stopping)
      log(
        "info",
        "ROUTER_END",
        `Chosen agent: ${nextAgent?.name || "None (Stopping Loop)"}`,
        { chosenAgent: nextAgent?.name || "None (Stopping Loop)" }
      )
      return nextAgent // Return the chosen agent or undefined
    },
  })
  return network
}

export { type NetworkRun } // Re-export NetworkRun type
