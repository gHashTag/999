import { Agent } from "@inngest/agent-kit"
import { deepseek } from "@inngest/ai/models"
import type { AgentDependencies, AnyTool } from "@/types/agents"

export const createCodingAgent = ({
  instructions,
  ...dependencies
}: { instructions: string } & AgentDependencies): Agent<any> => {
  const { apiKey, modelName, allTools, log } = dependencies

  // Filter tools specifically needed by Coder
  const toolsToUse = allTools.filter((tool: AnyTool) =>
    ["runTerminalCommand", "createOrUpdateFiles", "readFiles"].includes(
      tool.name
    )
  )

  log?.info("Creating Coder Agent", { toolCount: toolsToUse.length })

  return new Agent({
    name: "Coder Agent",
    description: "Пишет код для прохождения тестов, следуя стилю и паттернам.",
    system: instructions,
    model: deepseek({ apiKey, model: modelName }),
    tools: toolsToUse,
  })
}
