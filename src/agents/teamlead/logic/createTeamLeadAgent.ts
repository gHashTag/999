import { AgentDefinition } from "@inngest/agent-kit"
import { AgentDependencies } from "@/definitions/agentDependencies" // Correct import path
import { TeamLeadTools } from "../tools" // Assuming tools are defined here if needed later
import { createAgent } from "@inngest/agent-kit"
import { deepseek } from "@inngest/ai/models"
import type { AnyTool } from "@/types/agents"

/**
 * Creates the definition for the Team Lead agent.
 * This agent is responsible for analyzing the overall task description
 * and decomposing it into specific, verifiable test requirements.
 */
export const createTeamLeadAgent = (
  dependencies: AgentDependencies
): AgentDefinition<TeamLeadTools> => {
  const { baseModel, systemEvents, sandbox, allTools } = dependencies // Use the dependencies

  // Инструменты, которые может использовать этот агент
  const agentSpecificTools = allTools.filter((tool: AnyTool) =>
    [
      "web_search", // Keep web_search as per instructions
      "askHumanForInput", // Add the tool for asking human
      // Add other tools if TeamLead needs them directly
    ].includes(tool.name)
  )

  // Use imported string
  const systemPrompt = teamLeadInstructions
  return createAgent({
    id: "team-lead",
    name: "Team Lead Agent",
    description:
      "Analyzes the main task and creates verifiable requirements for the Tester.",
    system: systemPrompt,
    llm: {
      model: baseModel, // Используем базовую модель из зависимостей
    },
    tools: agentSpecificTools,
    events: systemEvents, // Use system events from dependencies
    sandbox: sandbox, // Use sandbox from dependencies
  })
}
