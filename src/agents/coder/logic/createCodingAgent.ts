import { Agent, type Tool } from "@inngest/agent-kit"
import { deepseek } from "@inngest/ai/models"
import { type AgentDependencies } from "@/types/agents"

export const createCodingAgent = (
  dependencies: AgentDependencies,
  instructions: string
): Agent<any> => {
  const { apiKey, modelName, tools, log } = dependencies

  // Filter tools specifically needed by Coder
  const allowedToolNames = [
    "readFile",
    "writeFile",
    "codebase_search",
    "grep_search",
  ] // Correct list from tests
  const toolsToUse = tools.filter((tool: Tool<any>) =>
    allowedToolNames.includes(tool.name)
  )

  log?.info("Creating Coder Agent", { toolCount: toolsToUse.length })

  return new Agent({
    name: "Coder", // Simplified name
    description: "Пишет код для прохождения тестов, следуя стилю и паттернам.",
    system: instructions,
    model: deepseek({ apiKey, model: modelName }),
    tools: toolsToUse,
  })
}
