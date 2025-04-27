import {
  Agent,
  // createAgent, // Removed unused import
} from "@inngest/agent-kit"
import { deepseek } from "@inngest/ai/models"
import type {
  AgentDependencies,
  AnyTool,
  // AvailableAgent // Removed import
} from "@/types/agents" // Correct path
import { readAgentInstructions } from "@/utils/logic/readAgentInstructions"
// import type { TddNetworkState } from '@/types/network.types' // Likely unused

/**
 * Creates the Tooling agent.
 * @param dependencies - The dependencies for the agent.
 * @returns The Tooling agent instance.
 */
export const createToolingAgent = (
  dependencies: AgentDependencies
  // availableAgents: AvailableAgent[] // Removed parameter
): Agent<any> => {
  const { apiKey, modelName, allTools, log } = dependencies // Destructure needed deps

  const systemPrompt = readAgentInstructions("Tooling")

  // Use allTools directly, filtering logic remains
  const toolsToUse = allTools.filter((tool: AnyTool) =>
    [
      "run_terminal_cmd",
      "read_file",
      "edit_file",
      "delete_file",
      "list_dir",
      "file_search",
      "updateTaskState",
    ].includes(tool.name)
  )

  log?.info("Creating Tooling Agent", { toolCount: toolsToUse.length }) // Optional logging

  return new Agent({
    // Use new Agent()
    name: "Tooling Agent",
    description: "Выполняет команды, скрипты и взаимодействует с окружением.",
    system: systemPrompt,
    model: deepseek({ apiKey, model: modelName }),
    tools: toolsToUse, // Use the determined tools
  })
}
