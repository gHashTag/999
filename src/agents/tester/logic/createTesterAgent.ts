import { Agent, type Tool } from "@inngest/agent-kit"
import { deepseek } from "@inngest/ai/models"
import type {
  AgentDependencies,
  // Removed unused AgentCreationProps
  // Removed unused HandlerLogger
} from "@/types/agents"
import type { TddNetworkState } from "@/types/network"

// Список инструментов, разрешенных для использования Агентом-Тестировщиком
const TESTER_ALLOWED_TOOLS = [
  "runTerminalCommand",
  "readFile",
  "updateTaskState",
  // Возможно, понадобятся writeFile, mcp_...?
]

// ----------------------------------------------------

/**
 * Creates the Tester agent instance.
 * Configures the agent with specific tools and system instructions.
 *
 * @param dependencies - The common dependencies injected into the agent.
 * @param instructions - The specific system prompt/instructions for the agent.
 * @returns An initialized Agent instance configured for the Tester role.
 */
export const createTesterAgent = (
  dependencies: AgentDependencies,
  instructions: string
): Agent<TddNetworkState> => {
  const { apiKey, modelName, tools, log } = dependencies
  // const {
  //   allTools, // Destructure tools from dependencies
  //   log, // Destructure logger from dependencies
  //   systemEvents, // Destructure event emitter from dependencies
  // } = dependencies

  const toolsToUse = tools.filter((tool: Tool<any>) =>
    TESTER_ALLOWED_TOOLS.includes(tool.name)
  )

  log?.info("Creating Tester Agent", { toolCount: toolsToUse.length })

  return new Agent({
    name: "Tester Agent", // Исправляем имя
    description: "Создает и запускает тесты, анализирует результаты.", // Добавляем описание
    system: instructions,
    model: deepseek({ apiKey, model: modelName }),
    tools: toolsToUse,
  })
}
