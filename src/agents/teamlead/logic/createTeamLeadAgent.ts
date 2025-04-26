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
    // System prompt is minimal as the main logic is in onResponse
    system: `You are the team leader. Your role is to start the process. You will receive an initial description of the task. Briefly confirm the task. Your main action is processed programmatically after your response. Which needs to be decomposed in the most detailed way according to the TDD principle.`,
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
