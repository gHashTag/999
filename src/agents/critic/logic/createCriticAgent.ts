/* eslint-disable @typescript-eslint/no-explicit-any */
import { Agent, type Tool } from "@inngest/agent-kit"
import { deepseek } from "@inngest/ai/models"
import {
  type AgentDependencies,
  // Removed unused AgentCreationProps
  // Removed unused HandlerLogger
} from "@/types/agents"
// import { getAllTools } from "@/tools/toolDefinitions" // Remove unused import
// Removed unused imports:
// import { NetworkStatus, type TddNetworkState } from "@/types/network"
// import { NetworkRun } from '@inngest/agent-kit'

/**
 * Creates the Critic agent.
 * @param dependencies - The dependencies for the agent.
 * @param instructions - The system instructions for the agent.
 * @returns The Critic agent instance.
 */
export const createCriticAgent = (
  dependencies: AgentDependencies,
  instructions: string
): Agent<any> => {
  const { apiKey, modelName, allTools, log } = dependencies

  // Filter tools specifically needed by Critic
  const allowedToolNames = ["updateTaskState", "web_search"] // Correct list from tests
  const toolsToUse = allTools.filter((tool: Tool<any>) =>
    allowedToolNames.includes(tool.name)
  )

  // Removed: const systemPrompt = readAgentInstructions("Critic")

  log?.info("Creating Critic Agent", { toolCount: toolsToUse.length })

  return new Agent({
    name: "Critic Agent",
    description:
      "Оценивает код, тесты или результаты выполнения команд, выполняет рефакторинг.", // Updated description
    system: instructions, // Use passed instructions
    model: deepseek({ apiKey, model: modelName }),
    tools: toolsToUse,
  })
}

// --- НОВАЯ ФУНКЦИЯ-ПАРСЕР --- //

/**
 * Parses the string output from the Critic LLM into the expected JSON structure.
 * @param llmOutput - The raw string output from the LLM.
 * @param logger - Optional logger for errors.
 * @returns The parsed JSON object or null if parsing fails.
 */
export const parseCriticResponse = (
  llmOutput: string,
  logger?: BaseLogger // Добавляем опциональный логгер
): {
  approved: boolean
  critique: string
  refactored_code: string | null
} | null => {
  try {
    // TODO: Add more robust parsing, potentially cleaning the string first (e.g., removing markdown backticks)
    const parsed = JSON.parse(llmOutput)

    // TODO: Add schema validation (e.g., using Zod) to ensure all fields exist and have correct types
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      typeof parsed.approved === "boolean" &&
      typeof parsed.critique === "string" &&
      (parsed.refactored_code === null ||
        typeof parsed.refactored_code === "string")
    ) {
      return parsed
    } else {
      logger?.warn("Parsed Critic LLM output failed schema validation", {
        parsed,
      })
      return null
    }
  } catch (error) {
    logger?.error("Failed to parse Critic LLM output as JSON", {
      error,
      llmOutput,
    })
    return null
  }
}
