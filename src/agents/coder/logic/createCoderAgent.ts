import { Agent, type Tool } from "@inngest/agent-kit"
import { deepseek } from "@inngest/ai/models"
import type { AgentDependencies } from "@/types/agents"
// import type { TddNetworkState } from '@/types/network.types'

// Список инструментов, разрешенных для использования Агентом-Разработчиком
const CODER_ALLOWED_TOOLS = [
  "readFile",
  "createOrUpdateFiles",
  "runTerminalCommand",
  "edit_file",
  "codebase_search",
  "grep_search",
]

/**
 * Creates the Coder agent.
 * @param dependencies - The dependencies for the agent, including instructions.
 * @param instructions - The system instructions for the agent.
 * @returns The Coder agent instance.
 */
export const createCoderAgent = ({
  instructions,
  ...dependencies
}: { instructions: string } & AgentDependencies): Agent<any> => {
  const { apiKey, modelName, allTools, log } = dependencies
  // log, systemEvents are unused for now

  // Use allTools directly, filtering logic remains
  const toolsToUse = allTools.filter((tool: Tool<any>) =>
    CODER_ALLOWED_TOOLS.includes(tool.name)
  )

  log?.info("Creating Coder Agent", { toolCount: toolsToUse.length }) // Optional logging

  return new Agent({
    name: "Coder Agent",
    description: "Пишет или исправляет код на основе требований и тестов.",
    system: instructions,
    model: deepseek({ apiKey, model: modelName }),
    tools: toolsToUse,
  })
}
