import { Agent } from "@inngest/agent-kit"
import { deepseek } from "@inngest/ai/models"
import type { AgentDependencies, AnyTool } from "@/types/agents"
// import type { TddNetworkState } from '@/types/network.types'
import { readAgentInstructions } from "@/utils/logic/readAgentInstructions"

// ----------------------------------------------------

/**
 * Creates the Tester agent.
 * @param dependencies - The dependencies for the agent.
 * @returns The Tester agent instance.
 */
export const createTesterAgent = (
  dependencies: AgentDependencies
): Agent<any> => {
  const { apiKey, modelName, allTools, log } = dependencies
  // const {
  //   allTools, // Destructure tools from dependencies
  //   log, // Destructure logger from dependencies
  //   systemEvents, // Destructure event emitter from dependencies
  // } = dependencies

  const systemPrompt = readAgentInstructions("Tester")

  // Use allTools directly, filtering logic remains
  const toolsToUse = allTools.filter((tool: AnyTool) =>
    ["updateTaskState", "runTerminalCommand"].includes(tool.name)
  )

  log?.info("Creating Tester Agent", { toolCount: toolsToUse.length }) // Optional logging

  return new Agent({
    name: "Tester Agent",
    description:
      "Генерирует тесты или команды для их создания на основе требований.",
    system: systemPrompt,
    model: deepseek({ apiKey, model: modelName }),
    tools: toolsToUse, // Use the determined tools
  })
}
