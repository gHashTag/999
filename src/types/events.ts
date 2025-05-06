import { z } from "zod"
// Import TddNetworkState for validation, not the zod schema directly
// import { TddNetworkState, tddNetworkStateSchema } from './network';
// import { TddNetworkState } from "./network"
// import { EventPayload } from "inngest"

// Define the main event payload schema
export const codingAgentEventDataSchema = z.object({
  input: z.string(),
  eventId: z.string(), // Добавим eventId, так как он ожидается в data
  // currentState: tddNetworkStateSchema.optional(), // Используем явный тип, а не схему Zod
  // Temporarily use z.any() until full state management is robust
  currentState: z.any().optional(), // Using z.any() temporarily
})

// Тип для события
export type CodingAgentEventData = z.infer<typeof codingAgentEventDataSchema>

// Определяем тип полезной нагрузки события, включая data и опционально user
export type CodingAgentEventPayload = {
  data: CodingAgentEventData
  // user?: { id: string }; // Пример пользовательского контекста, если понадобится
}

// Определяем Record всех событий проекта для EventSchemas
export type AllProjectEvents = {
  "coding-agent/run": CodingAgentEventPayload
  // Здесь можно будет добавлять другие события проекта
  // "another/event": AnotherEventPayload;
}

// Тип, представляющий полный объект события, как его ожидает EventPayload<T>
export type CodingAgentFullEvent = {
  name: "coding-agent/run" // Имя события должно совпадать
  data: CodingAgentEventData // Данные события
  id?: string // Опциональный ID
  user?: any // Опциональный пользовательский контекст
  ts?: number // Опциональный timestamp
  v?: string // Опциональная версия
}

// Старый тип CodingAgentEvent можно удалить или оставить, если он где-то используется иначе
// export type CodingAgentEvent = {
//   name: "coding-agent/run"
//   data: CodingAgentEventData
//   id?: string
// }
