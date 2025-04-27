import {
  Agent,
  // createAgent, // Removed unused import
} from "@inngest/agent-kit"
import { deepseek } from "@inngest/ai/models"
import type {
  AgentDependencies,
  AnyTool,
  // AvailableAgent // Removed import
} from "@/types/agents" // Correct path
// import type { TddNetworkState } from '@/types/network.types' // Likely unused

/**
 * Creates the Tooling/DevOps agent.
 * @param dependencies - The dependencies for the agent, including instructions.
 * @param instructions - The system instructions for the agent.
 * @returns The Tooling agent instance.
 */
export const createToolingAgent = ({
  instructions,
  ...dependencies
}: { instructions: string } & AgentDependencies): Agent<any> => {
  const { apiKey, modelName, allTools, log } = dependencies

  // Tooling agent usually needs most/all tools
  // Filter out any tools it definitely should NOT use, if any.
  const toolsToUse = allTools.filter(
    (tool: AnyTool) => tool.name !== "askHumanForInput" // Example exclusion
  )

  log?.info("Creating Tooling Agent", { toolCount: toolsToUse.length })

  return new Agent({
    // Use new Agent()
    name: "Tooling Agent",
    description:
      "Выполняет команды, работает с файлами, скриптами, git, артефактами.",
    system: instructions, // Use passed instructions
    model: deepseek({ apiKey, model: modelName }),
    tools: toolsToUse, // Provide all tools by default
  })
}
