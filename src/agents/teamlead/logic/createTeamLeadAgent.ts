import { Agent } from "@inngest/agent-kit"
import { type AgentDependencies } from "@/types/agents"
import { createAgent } from "@inngest/agent-kit"
import { deepseek } from "@inngest/ai/models"
import type { AnyTool } from "@/types/agents"
import { readAgentInstructions } from "@/utils/logic/readAgentInstructions"

/**
 * Creates the definition for the Team Lead agent.
 * @param deps - Agent dependencies.
 * @returns The Team Lead agent instance.
 */
export function createTeamLeadAgent({
  allTools,
  apiKey,
  modelName,
}: AgentDependencies): Agent<AnyTool[]> {
  const agentSpecificTools = allTools.filter((tool: AnyTool) => {
    return tool.name === "askHumanForInput"
  })

  const systemPrompt = readAgentInstructions("TeamLead")

  return createAgent({
    name: "Team Lead Agent",
    description:
      "Analyzes the main task and creates verifiable requirements for the Tester.",
    model: deepseek({ apiKey, model: modelName }),
    tools: agentSpecificTools,
    system: systemPrompt,
  })
}
