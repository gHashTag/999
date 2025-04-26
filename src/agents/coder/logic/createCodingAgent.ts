/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
import { createAgent } from "@inngest/agent-kit"
import { deepseek } from "@inngest/ai/models"
import type { AgentDependencies, AnyTool } from "@/types/agents"
// NetworkStatus might not be needed directly here if lifecycle is removed
// import { NetworkStatus } from "@/types/network" // Commented out/Removed

// --- Import instructions using Vite ?raw ---
// Relative path is correct here as .cursor is outside src
import coderInstructions from "../../../.cursor/rules/AGENT_Coder.mdc?raw"
// ----------------------------------------------------

export function createCodingAgent({
  allTools,
  apiKey, // Keep for fallback
  modelName, // Keep for fallback
}: AgentDependencies) {
  // Use imported string
  const systemPrompt = coderInstructions

  // Проверка, что инструкции загрузились (добавлено для надежности)
  if (!systemPrompt || systemPrompt.trim() === "") {
    console.error(
      "CRITICAL_ERROR: Coder instructions could not be loaded or are empty."
    )
    throw new Error(
      "Coder instructions are missing or empty. Check the path and file content: .cursor/rules/AGENT_Coder.mdc"
    )
  }

  return createAgent({
    name: "Coding Agent",
    description:
      "Writes or fixes implementation code based on tests and critique.",
    system: systemPrompt,
    // Use deepseek directly
    model: deepseek({
      apiKey: apiKey,
      model: modelName,
    }),
    // Coder needs web search, codebase search, and file/terminal tools
    tools: allTools.filter((tool: AnyTool) =>
      [
        "web_search",
        "codebase_search",
        "grep_search",
        "edit_file",
        "read_file", // Added read_file as Coder likely needs it
        // "askHumanForInput", // Removed
      ].includes(tool.name)
    ),
    // REMOVE incorrect lifecycle hook - Coder doesn't generate commands or set test critique status
    // lifecycle: { ... onResponse hook removed ... },
  })
}
