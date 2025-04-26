import { createAgent } from "@inngest/agent-kit"
import { deepseek } from "@inngest/ai/models"
import type { AgentDependencies, AnyTool } from "@/types/agents"

// --- Импорт инструкций с использованием Vite ?raw ---
// Relative path is correct here as .cursor is outside src
import toolingInstructions from "../../../.cursor/rules/AGENT_Tooling.mdc?raw"
// ----------------------------------------------------

// --- Агент Инструментальщик ---
export function createToolingAgent({
  allTools,
  apiKey,
  modelName,
}: AgentDependencies) {
  const systemPrompt = toolingInstructions

  if (!systemPrompt || systemPrompt.trim() === "") {
    console.error(
      "CRITICAL_ERROR: Tooling instructions could not be loaded or are empty."
    )
    throw new Error(
      "Tooling instructions are missing or empty. Check the path and file content: .cursor/rules/AGENT_Tooling.mdc"
    )
  }

  return createAgent({
    name: "Tooling Agent",
    description: "Выполняет команды, скрипты и взаимодействует с окружением.",
    system: systemPrompt,
    // Use deepseek directly
    model: deepseek({ apiKey, model: modelName }),
    // Этому агенту нужны все инструменты для взаимодействия с ФС и терминалом
    // Note: Consider if Critic/Coder should call this agent or use tools directly via Gemini
    tools: allTools.filter((tool: AnyTool) =>
      [
        // Core file system and execution tools
        "run_terminal_cmd",
        "read_file",
        "edit_file",
        "delete_file",
        "list_dir",
        "file_search",
        // Potentially others depending on how interaction is designed
        // (e.g., specific script execution tools if added later)
      ].includes(tool.name)
    ),
  })
}
