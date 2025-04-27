import { Agent /* type Tool - unused */ } from "@inngest/agent-kit"
// import { type AgentDependencies } from "@/types/agents" // Correct import path below
// import { createAgent } from "@inngest/agent-kit" // Use new Agent()
// import { deepseek } from "@inngest/ai/models" // REMOVE THIS IMPORT
import {
  type AgentDependencies,
  // Removed unused AgentCreationProps
  // Removed unused HandlerLogger
} from "@/types/agents"
// import { createUpdateTaskStateTool } from "@/tools/definitions/updateTaskStateTool" // Unused
// import { filterTeamLeadTools } from "./filterTools" // Unused
// import { readAgentInstructions } from "@/utils/logic/readAgentInstructions"
// import type { TddNetworkState } from '@/types/network.types'

/**
 * Creates the TeamLead agent.
 * @param dependencies - The dependencies for the agent, including instructions.
 * @param instructions - The system instructions for the agent.
 * @returns The TeamLead agent instance.
 */
export const createTeamLeadAgent = ({
  instructions,
  ...dependencies
}: { instructions: string } & AgentDependencies): Agent<any> => {
  // Extract ONLY used dependencies
  const { log, model, allTools } = dependencies // Extract allTools

  // Restore tool filtering logic
  const requiredToolNames = ["updateTaskState", "web_search"]
  const toolsToUse = allTools.filter(tool =>
    requiredToolNames.includes(tool.name)
  )

  log?.info("Creating TeamLead Agent", { toolCount: toolsToUse.length })

  return new Agent({
    name: "TeamLead Agent",
    description:
      "Анализирует задачу, декомпозирует ее и формулирует требования для TDD.",
    system: instructions,
    model: model, // Pass the extracted model
    tools: toolsToUse,
  })
}
