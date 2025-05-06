import {
  Agent,
  type Tool,
  // createAgent, // Removed unused import
} from "@inngest/agent-kit"
import { deepseek } from "@inngest/ai/models"
import type {
  AgentDependencies,
  // Removed unused AgentCreationProps
  // Removed unused HandlerLogger
  // AvailableAgent // Removed import
} from "@/types/agents" // Correct path
// import type { TddNetworkState } from '@/types/network.types' // Likely unused

// Список инструментов, ЗАПРЕЩЕННЫХ для Агента-Инструментальщика
const TOOLING_DISALLOWED_TOOLS = ["askHumanForInput"]

/**
 * Creates the Tooling/DevOps agent.
 * @param dependencies - The dependencies for the agent, including instructions.
 * @param instructions - The system instructions for the agent.
 * @returns The Tooling agent instance.
 */
export const createToolingAgent = (
  dependencies: AgentDependencies,
  instructions: string
): Agent<any> => {
  const { apiKey, modelName, tools, log } = dependencies

  // Tooling agent usually needs most/all tools
  // Filter out any tools it definitely should NOT use, if any.
  // Используем константу с обратной логикой
  const toolsToUse = tools.filter(
    (tool: Tool<any>) => !TOOLING_DISALLOWED_TOOLS.includes(tool.name) // Фильтруем по ЗАПРЕЩЕННЫМ
  )

  log?.info("Creating Tooling Agent", { toolCount: toolsToUse.length })

  return new Agent({
    // Use new Agent()
    name: "Tooling Agent",
    description:
      "Executes tools and commands related to the environment, filesystem, and processes.",
    system: instructions, // Use passed instructions
    model: deepseek({ apiKey, model: modelName }),
    tools: toolsToUse, // Provide all tools by default
  })
}
