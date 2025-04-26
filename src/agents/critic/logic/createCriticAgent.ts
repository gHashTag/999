/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
import {
  createAgent,
  type NetworkRun, // Keep NetworkRun for context type
} from "@inngest/agent-kit"
import { deepseek } from "@inngest/ai/models"
import type { AgentDependencies, AnyTool } from "@/types/agents"
import { NetworkStatus, type TddNetworkState } from "@/types/network"
// import { log } from "@/utils/logic/logger" // Removed unused

// --- Импорт инструкций с использованием Vite ?raw ---
import criticInstructions from "../../../.cursor/rules/AGENT_Critic.mdc?raw"
// ----------------------------------------------------

// Helper type for critique result - может быть вынесен в types
// type CritiqueResult = { // Removed unused
//   critique?: string
//   approved: boolean
// }

// Define a type for the network object passed to system function
// This is an approximation based on usage; AgentKit might have a specific type
// interface SystemNetworkContext {
//   get: (key: string) => Partial<TddNetworkState> | undefined
//   // Add other network properties if needed
// }

export function createCriticAgent({
  allTools,
  apiKey, // Now needed for deepseek call
  modelName, // Now needed for deepseek call
  // baseModel, // Removed baseModel dependency
}: AgentDependencies) {
  const baseSystemPrompt = criticInstructions

  // Проверка, что инструкции загрузились
  if (!baseSystemPrompt || baseSystemPrompt.trim() === "") {
    console.error(
      "CRITICAL_ERROR: Critic instructions could not be loaded or are empty."
    )
    throw new Error(
      "Critic instructions are missing or empty. Check the path and file content: .cursor/rules/AGENT_Critic.mdc"
    )
  }

  return createAgent({
    name: "Critic Agent",
    description:
      "Проводит ревью требований, тестов, кода или результатов команд.",
    system: async (ctx: { network?: NetworkRun<any> | undefined }) => {
      // Use optional chaining and provide default for state
      const state: Partial<TddNetworkState> =
        ctx.network?.state.kv.get("network_state") || {}
      const status = state.status
      let dynamicContext = ""

      // Add dynamic context based on status
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
    // Инструменты для Критика (без askHumanForInput и без прямого изменения файлов/системы)
    tools: allTools.filter((tool: AnyTool) => {
      // Явно разрешенные инструменты
      const allowedTools = [
        "web_search", // Для поиска лучших практик
        "read_file", // Для чтения кода/артефактов
        "codebase_search", // Для поиска по базе
        "grep_search", // Для точного поиска
        // "askHumanForInput", // УДАЛЕНО
      ]
      // Явно запрещенные (на всякий случай, если появятся новые)
      const forbiddenTools = ["edit_file", "run_terminal_cmd", "delete_file"]
      return (
        allowedTools.includes(tool.name) && !forbiddenTools.includes(tool.name)
      )
    }),
  })
}
