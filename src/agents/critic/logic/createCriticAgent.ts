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
 * @param dependencies - The dependencies for the agent, including instructions.
 * @param instructions - The system instructions for the agent.
 * @returns The Critic agent instance.
 */
export const createCriticAgent = ({
  instructions,
  ...dependencies
}: { instructions: string } & AgentDependencies): Agent<any> => {
  const { apiKey, modelName, allTools, log } = dependencies

  // Filter tools specifically needed by Critic
  const toolsToUse = allTools.filter((tool: Tool<any>) =>
    [
      "readFile",
      "web_search", // Critic might need to check best practices
      "updateTaskState",
      // Add other tool names as needed
    ].includes(tool.name)
  )

  // Removed: const systemPrompt = readAgentInstructions("Critic")

  log?.info("Creating Critic Agent", { toolCount: toolsToUse.length })

  return new Agent({
    name: "Critic Agent",
    description: "Оценивает код, тесты и результаты, выполняет рефакторинг.",
    system: instructions, // Use passed instructions
    model: deepseek({ apiKey, model: modelName }),
    tools: toolsToUse,
  })
}
