// src/types/network.ts
// Contains all type definitions related to the Agent Network state and status.

// Import Zod for schema definition and the NetworkStatus enum
import { z } from "zod"
// import { type Agent } from "@inngest/agent-kit" // Был удален ранее, оставляем закомментированным
// import { type ToolInput } from "@inngest/agent-kit/tool" // Удаляем неверный и неиспользуемый импорт
// import type { Sandbox } from "@e2b/sdk" // Удаляем неиспользуемый импорт

// Define the Network Statuses
export const NetworkStatus = z.enum([
  "NEEDS_TEAMLEAD_INPUT", // Запрос к TeamLead для первоначальной обработки
  "NEEDS_REQUIREMENTS", // Руководитель должен определить требования
  "NEEDS_REQUIREMENTS_CRITIQUE", // Критик должен проверить требования
  "NEEDS_TEST", // Тестировщик должен написать/сгенерировать тесты
  "NEEDS_TEST_CRITIQUE", // Критик должен проверить тесты
  "NEEDS_CODE", // Разработчик должен написать код для прохождения тестов (начальная реализация)
  "NEEDS_IMPLEMENTATION", // Разработчик должен написать код (синоним NEEDS_CODE, возможно, для уточнений)
  "NEEDS_TYPE_CHECK", // Нужна проверка типов TypeScript
  "NEEDS_IMPLEMENTATION_CRITIQUE", // Критик должен проверить код и, возможно, отрефакторить
  "NEEDS_IMPLEMENTATION_REVISION", // Разработчик должен доработать код по критике
  "NEEDS_COMMAND_EXECUTION", // Инструментальщик должен выполнить команду (например, open-codex)
  "NEEDS_COMMAND_VERIFICATION", // Критик/Тестировщик должен проверить результат команды
  "NEEDS_HUMAN_INPUT", // Требуется вмешательство человека
  "COMPLETED", // Задача успешно завершена
  "FAILED", // Задача провалена
  "PENDING_PROJECT_UPLOAD",
  "PROJECT_UPLOADED",
  "NEEDS_CLARIFICATION", // Руководитель запраширует уточнения у пользователя
])
export type NetworkStatus = z.infer<typeof NetworkStatus>

// Type for the state object managed by the Agent Network
export interface TddNetworkState {
  status?: NetworkStatus
  run_id?: string
  task?: string // Оригинальное задание, возможно, стоит переименовать для ясности
  sandboxId?: string | null
  test_requirements?: string
  test_code?: string
  implementation_code?: string
  critic_feedback?: string // Specific feedback from Critic for revisions
  critique?: string // General critique or error messages (e.g., from type check)
  clarification_needed?: string // Added to store clarification requests
  command_to_execute?: string // Added to store command to be executed
  error?: string | null
  // Attempts and revisions tracking
  attempts?: Record<string, number> // e.g. { teamlead: 1, coder: 2 }
  revisions?: number // General revision count for the current coding/testing cycle
  // Additional fields as needed
  test_file_path?: string
  implementation_file_path?: string
  last_command_output?: string
  test_results?: any // Allow other properties like detailed reports
  task_description?: string // Детальное описание текущей подзадачи (может отличаться от task)
  eventId?: string // Добавлено для связи с Inngest событием
}

// Update the Zod schema to include run_id and optional error
// Removed unused schema definition
// const tddNetworkStateSchema = z.object({
//   status: z.enum([
//     NetworkStatus.Enum.IDLE,
//     NetworkStatus.Enum.READY,
//     NetworkStatus.Enum.NEEDS_REQUIREMENTS_CRITIQUE,
//     NetworkStatus.Enum.NEEDS_TEST,
//     NetworkStatus.Enum.NEEDS_TEST_REVISION,
//     NetworkStatus.Enum.NEEDS_CODE,
//     NetworkStatus.Enum.NEEDS_TYPE_CHECK,
//     NetworkStatus.Enum.NEEDS_TEST_CRITIQUE,
//     NetworkStatus.Enum.NEEDS_IMPLEMENTATION_REVISION,
//     NetworkStatus.Enum.NEEDS_COMMAND_EXECUTION,
//     NetworkStatus.Enum.NEEDS_COMMAND_VERIFICATION,
//     NetworkStatus.Enum.NEEDS_HUMAN_INPUT,
//     NetworkStatus.Enum.COMPLETED,
//     NetworkStatus.Enum.FAILED,
//   ]),
//   run_id: z.string(),
//   task: z.string(),
//   sandboxId: z.string().optional(),
//   test_requirements: z.string().optional(),
//   test_code: z.string().optional(),
//   implementation_code: z.string().optional(),
//   critic_feedback: z.string().optional(),
//   clarification_needed: z.string().optional(),
//   command_to_execute: z.string().optional(),
//   error: z.string().optional(),
//   attempts: z.record(z.string(), z.number()).optional(),
//   revisions: z.number().optional(),
//   test_file_path: z.string().optional(),
//   implementation_file_path: z.string().optional(),
//   last_command_output: z.string().optional(),
// })

// Remove duplicate type definition
// export type TddNetworkState = z.infer<typeof tddNetworkStateSchema>
