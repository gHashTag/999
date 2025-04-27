import { Agent } from "@inngest/agent-kit"
import { deepseek } from "@inngest/ai/models"
import type { AgentDependencies, AnyTool } from "@/types/agents"
import { readAgentInstructions } from "@/utils/logic/readAgentInstructions"
// import type { TddNetworkState } from '@/types/network.types'

/**
 * Creates the Coder agent.
 * @param dependencies - The dependencies for the agent.
 * @returns The Coder agent instance.
 */
export const createCoderAgent = (
  dependencies: AgentDependencies
): Agent<any> => {
  const { apiKey, modelName, allTools, log } = dependencies
  // log, systemEvents are unused for now

  // Use allTools directly, filtering logic remains
  const toolsToUse = allTools.filter((tool: AnyTool) =>
    [
      "readFile",
      "editFile",
      "codebase_search",
      "grep_search",
      "updateTaskState",
    ].includes(tool.name)
  )

  const systemPrompt = readAgentInstructions("Coder")

  log?.info("Creating Coder Agent", { toolCount: toolsToUse.length }) // Optional logging

  return new Agent({
    name: "Coder Agent",
    description: "Пишет или исправляет код на основе требований и тестов.",
    system: systemPrompt,
    model: deepseek({ apiKey, model: modelName }),
    tools: toolsToUse,
  })
}
