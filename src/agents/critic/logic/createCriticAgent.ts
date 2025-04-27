/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Agent,
  type NetworkRun, // Keep NetworkRun for context type
  // createAgent, // Removed unused import
} from "@inngest/agent-kit"
import { deepseek } from "@inngest/ai/models"
import type {
  AgentDependencies, // Import from local types
  AnyTool, // Import from local types
  // AvailableAgent // Removed import
} from "@/types/agents" // Correct path
import { NetworkStatus, type TddNetworkState } from "@/types/network"
// import type { TddNetworkState } from '@/types/network.types' // Likely unused

import { readAgentInstructions } from "@/utils/logic/readAgentInstructions" // ADD import for utility

export const createCriticAgent = (
  dependencies: AgentDependencies
  // availableAgents: AvailableAgent[] // Removed parameter
): Agent<any> => {
  const { apiKey, modelName, allTools, log } = dependencies // Destructure needed deps

  // Use allTools directly, filtering logic remains
  const toolsToUse = allTools.filter((tool: AnyTool) => {
    const allowedTools = [
      "read_file",
      "codebase_search",
      "grep_search",
      "updateTaskState",
    ]
    const forbiddenTools = ["edit_file", "run_terminal_cmd", "delete_file"]
    return (
      allowedTools.includes(tool.name) && !forbiddenTools.includes(tool.name)
    )
  })

  const baseSystemPrompt = readAgentInstructions("Critic")

  log?.info("Creating Critic Agent", { toolCount: toolsToUse.length }) // Optional logging

  return new Agent({
    name: "Critic Agent",
    description:
      "Проводит ревью требований, тестов, кода или результатов команд.",
    system: async (ctx: { network?: NetworkRun<any> | undefined }) => {
      const state: Partial<TddNetworkState> =
        ctx.network?.state.kv.get("network_state") || {}
      const status = state.status
      let dynamicContext = ""

      // FIX: Use NetworkStatus.Enum.VALUE for comparisons
      if (status === NetworkStatus.Enum.NEEDS_REQUIREMENTS_CRITIQUE) {
        dynamicContext = `\n\n**Текущая Задача:** Провести ревью следующих требований от Руководителя:\n${state.test_requirements || "Требования отсутствуют."}`
      } else if (status === NetworkStatus.Enum.NEEDS_TEST_CRITIQUE) {
        dynamicContext = `\n\n**Текущая Задача:** Провести ревью следующего кода/команды для тестов:\n${state.test_code || state.command_to_execute || "Код/команда теста отсутствует."}\n**Предыдущая критика (если есть):** ${state.test_critique || "Нет"}`
      } else if (status === NetworkStatus.Enum.NEEDS_IMPLEMENTATION_CRITIQUE) {
        dynamicContext = `\n\n**Текущая Задача:** Провести ревью следующего кода реализации:\n${state.implementation_code || "Код реализации отсутствует."}\n**Связанные тесты:**\n${state.test_code || "Код тестов отсутствует."}\n**Предыдущая критика (если есть):** ${state.implementation_critique || "Нет"}`
      } else if (status === NetworkStatus.Enum.NEEDS_COMMAND_VERIFICATION) {
        dynamicContext = `\n\n**Текущая Задача:** Проверить вывод последней выполненной команды:\n${state.last_command_output || "Вывод команды отсутствует."}`
      }
      return `${baseSystemPrompt}${dynamicContext}`
    },
    model: deepseek({ apiKey, model: modelName }),
    tools: toolsToUse,
  })
}
