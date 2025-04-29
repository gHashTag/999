/* eslint-disable @typescript-eslint/no-explicit-any */
import { Agent, type Tool } from "@inngest/agent-kit"
import { deepseek } from "@inngest/ai/models"
import {
  type AgentDependencies,
  // Removed unused AgentCreationProps
  // Removed unused HandlerLogger
} from "@/types/agents"
// import { getAllTools } from "@/tools/toolDefinitions" // Remove unused import
// Removed unused imports:
// import { NetworkStatus, type TddNetworkState } from "@/types/network"
// import { NetworkRun } from '@inngest/agent-kit'

/**
 * Creates the Critic agent.
 * @param dependencies - The dependencies for the agent.
 * @param instructions - The system instructions for the agent.
 * @returns The Critic agent instance.
 */
export const createCriticAgent = (
  dependencies: AgentDependencies,
  instructions: string
): Agent<any> => {
  const { apiKey, modelName, allTools, log } = dependencies

  // Filter tools specifically needed by Critic
  const allowedToolNames = ["updateTaskState", "web_search"] // Correct list from tests
  const toolsToUse = allTools.filter((tool: Tool<any>) =>
    allowedToolNames.includes(tool.name)
  )

  // Removed: const systemPrompt = readAgentInstructions("Critic")

  log?.info("Creating Critic Agent", { toolCount: toolsToUse.length })

  return new Agent({
    name: "Critic", // Simplified name
    description:
      "Оценивает код, тесты или результаты выполнения команд, выполняет рефакторинг.", // Updated description
    system: instructions, // Use passed instructions
    model: deepseek({ apiKey, model: modelName }),
    tools: toolsToUse,
  })
}
