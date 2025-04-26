import { createAgent } from "@inngest/agent-kit"
import { deepseek } from "@inngest/ai/models"
import type { AgentDependencies, AnyTool } from "@/types/agents"
import { readAgentInstructions } from "@/utils/logic/readAgentInstructions" // ADD import for utility

export function createCodingAgent({
  allTools,
  apiKey, // Keep for fallback
  modelName, // Keep for fallback
}: AgentDependencies) {
  // Read instructions using the utility function
  const systemPrompt = readAgentInstructions("Coder")

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
        "read_file",
      ].includes(tool.name)
    ),
  })
}
