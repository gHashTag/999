import { Agent, type Tool } from "@inngest/agent-kit"
import { deepseek } from "@inngest/ai/models"
import type {
  AgentDependencies,
  // Removed unused AgentCreationProps
  // Removed unused HandlerLogger
} from "@/types/agents"
// import type { TddNetworkState } from '@/types/network.types'

// ----------------------------------------------------

/**
 * Creates the Tester agent.
 * @param dependencies - The dependencies for the agent.
 * @param instructions - The system instructions for the agent.
 * @returns The Tester agent instance.
 */
export const createTesterAgent = (
  dependencies: AgentDependencies,
  instructions: string
): Agent<any> => {
  const { apiKey, modelName, allTools, log } = dependencies
  // const {
  //   allTools, // Destructure tools from dependencies
  //   log, // Destructure logger from dependencies
  //   systemEvents, // Destructure event emitter from dependencies
  // } = dependencies

  // Filter tools specifically needed by Tester
  const allowedToolNames = ["runTerminalCommand", "readFile", "updateTaskState"] // Correct list from tests
  const toolsToUse = allTools.filter((tool: Tool<any>) =>
    allowedToolNames.includes(tool.name)
  )

  log?.info("Creating Tester Agent", { toolCount: toolsToUse.length }) // Optional logging

  return new Agent({
    name: "Tester", // Simplified name
    description:
      "Создает или выполняет команды для создания тестов, запускает тесты и анализирует результаты.",
    system: instructions, // Use passed instructions
    model: deepseek({ apiKey, model: modelName }),
    tools: toolsToUse, // Use the determined tools
  })
}
