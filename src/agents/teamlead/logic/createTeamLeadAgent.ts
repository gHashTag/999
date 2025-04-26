import {
  createAgent,
  type AgentResult,
  type NetworkRun,
} from "@inngest/agent-kit"
import { deepseek } from "@inngest/ai/models"
import type { AgentDependencies } from "@/types/agents"
import { NetworkStatus, type TddNetworkState } from "@/types/network"
import { log } from "@/utils/logic/logger"

// TeamLead doesn't need specific tools beyond the base model for simple logic or potential future interaction.
export function createTeamLeadAgent({
  apiKey,
  modelName,
}: Omit<AgentDependencies, "allTools" | "log">) {
  // Omit unused dependencies

  return createAgent({
    name: "TeamLead Agent",
    description: "Initiates the TDD workflow by setting the initial status.",
    // System prompt updated to explicitly require decomposition into testable requirements
    system: `You are the Team Lead Agent, initiating a Test-Driven Development (TDD) workflow.
Your primary role is to receive the initial task description and **decompose it into clear, specific, and testable requirements (acceptance criteria)**. These requirements will guide the Tester agent.

**Instructions:**
1.  Receive the initial task description (e.g., "Create a function that adds two numbers").
2.  Analyze the task and break it down into the smallest possible testable units.
3.  Formulate these units as clear acceptance criteria or specific test cases needed.
4.  **Output Format:** Respond ONLY with a numbered or bulleted list of these testable requirements/criteria. Do NOT add introductions or confirmations.

**Example Input Task:** "Create a function that adds two numbers"

**Example Output (Your Response):**
*   Should add two positive numbers correctly (e.g., 2 + 3 = 5).
*   Should add a positive and a negative number correctly (e.g., 5 + (-2) = 3).
*   Should add two negative numbers correctly (e.g., -2 + (-3) = -5).
*   Should handle adding zero correctly (e.g., 0 + 7 = 7).

**Your output (the list of requirements) will be used to guide the next step (test generation).** The status update (NEEDS_TEST) is handled programmatically after your response.`,
    model: deepseek({
      apiKey: apiKey,
      model: modelName,
    }),
    tools: [], // No specific tools needed for now
    lifecycle: {
      onResponse: async (opts: {
        result: AgentResult
        network?: NetworkRun<TddNetworkState>
      }): Promise<AgentResult> => {
        const { result, network } = opts

        if (network?.state?.kv) {
          const state = (network.state.kv.get("network_state") ??
            {}) as Partial<TddNetworkState>

          // Assuming task is set by the handler before calling the network

          // Set the initial status to start the workflow with the Tester
          state.status = NetworkStatus.Enum.NEEDS_TEST

          network.state.kv.set("network_state", state)
          // Use log directly
          log(
            "info",
            "TEAMLEAD_LIFECYCLE",
            `Workflow initiated. State set to ${state.status}.`,
            { status: state.status, task: state.task }
          )
        } else {
          // Use log directly
          log("warn", "TEAMLEAD_LIFECYCLE", `Network state KV not found.`)
        }
        return result
      },
    },
  })
}
