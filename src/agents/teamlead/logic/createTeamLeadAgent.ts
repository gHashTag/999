import { Agent } from "@inngest/agent-kit"
// import { type AgentDependencies } from "@/types/agents" // Correct import path below
// import { createAgent } from "@inngest/agent-kit" // Use new Agent()
import { deepseek } from "@inngest/ai/models"
import type {
  AgentDependencies,
  AnyTool,
  // StateData,
} from "@/types/agents"
// Import the creator function, not the instance directly
import { createUpdateTaskStateTool } from "@/tools/definitions/updateTaskStateTool"
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
  const { apiKey, modelName, allTools, log, eventId } = dependencies // Use eventId from dependencies

  // Create the specific tool instance needed
  const updateTaskStateToolInstance = createUpdateTaskStateTool(
    log,
    eventId || "placeholder-event-id-createTeamLeadAgent" // Use eventId or placeholder
  )

  // Ensure updateTaskStateTool is always included for TeamLead
  let toolsToUse: AnyTool[] = [
    updateTaskStateToolInstance, // Add the created tool instance
    ...allTools.filter(
      (tool: AnyTool) => tool.name !== "updateTaskState" // Avoid duplication if already present
    ),
  ]

  // Filter tools specifically needed by TeamLead (add others if needed)
  toolsToUse = toolsToUse.filter((tool: AnyTool) =>
    ["web_search", "updateTaskState"].includes(tool.name)
  )

  // Removed: const systemPrompt = readAgentInstructions("TeamLead")

  log?.info("Creating TeamLead Agent", { toolCount: toolsToUse.length })

  return new Agent({
    name: "TeamLead Agent",
    description:
      "Анализирует задачу, декомпозирует ее и формулирует требования для TDD.",
    system: instructions, // Use passed instructions
    model: deepseek({ apiKey, model: modelName }),
    tools: toolsToUse,
  })
}
