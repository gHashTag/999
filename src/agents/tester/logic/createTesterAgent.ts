import { createAgent } from "@inngest/agent-kit"
import { deepseek } from "@inngest/ai/models"
import type { AgentDependencies, AnyTool } from "@/types/agents"
import { readAgentInstructions } from "@/utils/logic/readAgentInstructions"

// ----------------------------------------------------

export function createTesterAgent({
  allTools,
  apiKey,
  modelName,
}: AgentDependencies) {
  const systemPrompt = readAgentInstructions("Tester")

  return createAgent({
    name: "Tester Agent",
    description:
      "Генерирует тесты или команды для их создания на основе требований.",
    system: systemPrompt,
    model: deepseek({ apiKey, model: modelName }),
    tools: allTools.filter((tool: AnyTool) =>
      ["web_search"].includes(tool.name)
    ),
  })
}
