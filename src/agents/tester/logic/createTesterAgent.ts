import { Agent } from "@inngest/agent-kit"
import { deepseek } from "@inngest/ai/models"
import type {
  AgentDependencies,
  AnyTool,
  // StateData,
} from "@/types/agents"
// import type { TddNetworkState } from '@/types/network.types'

// ----------------------------------------------------

/**
 * Creates the Tester agent.
 * @param dependencies - The dependencies for the agent, including instructions.
 * @param instructions - The system instructions for the agent.
 * @returns The Tester agent instance.
 */
export const createTesterAgent = ({
  instructions,
  ...dependencies
}: { instructions: string } & AgentDependencies): Agent<any> => {
  const { apiKey, modelName, allTools, log } = dependencies
  // const {
  //   allTools, // Destructure tools from dependencies
  //   log, // Destructure logger from dependencies
  //   systemEvents, // Destructure event emitter from dependencies
  // } = dependencies

  // Filter tools specifically needed by Tester
  const toolsToUse = allTools.filter((tool: AnyTool) =>
    [
      "runCommand", // Example: If Tester needs to run commands
      "readFile",
      "updateTaskState",
      // Add other tool names as needed
    ].includes(tool.name)
  )

  log?.info("Creating Tester Agent", { toolCount: toolsToUse.length }) // Optional logging

  return new Agent({
    name: "Tester Agent",
    description:
      "Создает или выполняет команды для создания тестов, запускает тесты и анализирует результаты.",
    system: instructions, // Use passed instructions
    model: deepseek({ apiKey, model: modelName }),
    tools: toolsToUse, // Use the determined tools
  })
}
