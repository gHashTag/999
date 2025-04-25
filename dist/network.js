import { createNetwork } from "@inngest/agent-kit";
import { deepseek } from "@inngest/ai/models";
import { NetworkStatus } from "./types.js";
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
export function createDevOpsNetwork(testerAgent, codingAgent, criticAgent
// FIX: Remove testRunnerAgent parameter
// testRunnerAgent: Agent<any>
) {
    const network = createNetwork({
        name: "TDD DevOps Team with Critique",
        // FIX: Remove testRunnerAgent from the agents list
        agents: [testerAgent, codingAgent, criticAgent],
        defaultModel: deepseek({
            apiKey: process.env.DEEPSEEK_API_KEY,
            model: process.env.DEEPSEEK_MODEL || "deepseek-coder",
        }),
        maxIter: 25, // Increased max iterations for potential revisions
        // TDD Router Logic with Critique Loop
        defaultRouter: async ({ network }) => {
            // Use imported TddNetworkState type
            const state = (network?.state?.kv?.get("network_state") || {
                status: "NEEDS_TEST",
            });
            console.log(`[Router] Current state status: ${state.status}`);
            switch (state.status) {
                case NetworkStatus.Enum.NEEDS_TEST:
                case NetworkStatus.Enum.NEEDS_TEST_REVISION: // Tester works in both cases
                    console.log("[Router] Routing to Tester Agent.");
                    return testerAgent;
                case NetworkStatus.Enum.NEEDS_CODE:
                case "NEEDS_CODE":
                case "NEEDS_CODE_REVISION": // Coder works in both cases
                    console.log("[Router] Routing to Coding Agent.");
                    return codingAgent;
                case "NEEDS_TEST_CRITIQUE":
                case "NEEDS_CODE_CRITIQUE": // Critic works in both cases
                    console.log("[Router] Routing to Critic Agent.");
                    return criticAgent;
                // FIX: Stop network loop when ready for final tests
                case NetworkStatus.Enum.READY_FOR_FINAL_TEST:
                    console.log("[Router] State is READY_FOR_FINAL_TEST. Stopping agent network loop.");
                    return; // Stop the agent loop
                case "COMPLETED":
                case "COMPLETED_TESTS_PASSED":
                case "COMPLETED_TESTS_FAILED":
                    console.log(`[Router] Task ended with status: ${state.status}. Stopping.`);
                    return;
                default: {
                    // const _exhaustiveCheck: never = state.status; // Keep commented out
                    console.error(`[Router] Unknown or unhandled status: ${state.status}. Stopping.`);
                    // FIX: Add explicit return to satisfy all code paths
                    return;
                }
            }
        },
    });
    return network;
}
//# sourceMappingURL=network.js.map