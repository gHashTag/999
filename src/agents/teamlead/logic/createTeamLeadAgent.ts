import { Agent } from "@inngest/agent-kit"
// import { type AgentDependencies } from "@/types/agents" // Correct import path below
// import { createAgent } from "@inngest/agent-kit" // Use new Agent()
import { deepseek } from "@inngest/ai/models"
import type { AgentDependencies, AnyTool } from "@/types/agents" // Correct import path
import { readAgentInstructions } from "@/utils/logic/readAgentInstructions"
import { TddNetworkState } from "@/types/network"

/**
 * Creates the definition for the Team Lead agent.
 * @param deps - Agent dependencies.
 * @returns The Team Lead agent instance.
 */
export const createTeamLeadAgent = (
  dependencies: AgentDependencies
  // availableAgents: AvailableAgent[] // Removed parameter
): Agent<TddNetworkState> => {
  const { apiKey, modelName, allTools, log } = dependencies // Destructure needed deps

  log?.info("Creating TeamLead Agent...")

  // Use allTools directly, filtering logic remains
  const agentSpecificTools = allTools.filter((tool: AnyTool) => {
    return tool.name === "askHumanForInput" || tool.name === "updateTaskState"
  })

  log?.info(
    `Filtered tools for TeamLead: ${agentSpecificTools.map(t => t.name).join(", ")}`
  )

  const systemPrompt = readAgentInstructions("TeamLead")

  const agent = new Agent({
    // Use new Agent()
    name: "Team Lead Agent",
    description:
      "Analyzes the main task and creates verifiable requirements for the Tester.",
    model: deepseek({ apiKey, model: modelName }),
    tools: agentSpecificTools,
    system: systemPrompt,
  })

  return agent as unknown as Agent<TddNetworkState> // Keep cast for now if needed
}
