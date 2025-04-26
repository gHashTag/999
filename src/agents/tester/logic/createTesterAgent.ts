import { createAgent } from "@inngest/agent-kit"
import { deepseek } from "@inngest/ai/models" // Убрали импорт Any
import type { AgentDependencies, AnyTool } from "@/types/agents"

// --- Импорт инструкций с использованием Vite ?raw ---
import testerInstructions from "../../../.cursor/rules/AGENT_Tester.mdc?raw"
// ----------------------------------------------------

export function createTesterAgent({
  allTools,
  apiKey,
  modelName,
}: AgentDependencies) {
  const systemPrompt = testerInstructions

  if (!systemPrompt || systemPrompt.trim() === "") {
    console.error(
      "CRITICAL_ERROR: Tester instructions could not be loaded or are empty."
    )
    throw new Error(
      "Tester instructions are missing or empty. Check the path and file content: .cursor/rules/AGENT_Tester.mdc"
    )
  }

  return createAgent({
    name: "Tester Agent",
    description:
      "Генерирует тесты или команды для их создания на основе требований.",
    system: systemPrompt,
    // Убрали приведение к Any
    model: deepseek({ apiKey, model: modelName }),
    tools: allTools.filter((tool: AnyTool) =>
      ["web_search"].includes(tool.name)
    ),
  })
}
