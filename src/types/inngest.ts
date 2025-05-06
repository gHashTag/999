import { type Context, type EventPayload } from "inngest"
import { CodingAgentFullEvent } from "./events" // Оставляем только CodingAgentFullEvent
// Import the unified HandlerLogger using alias
import { HandlerLogger } from "@/types/agents" // FIX: Use alias
import type { Inngest } from "inngest"

// Logger interface used within Inngest handlers -- REMOVED
// export interface HandlerLogger {
//   info(...args: unknown[]): void
//   warn(...args: unknown[]): void
//   error(...args: unknown[]): void
//   debug(...args: unknown[]): void
// }

// Type for the main codingAgentHandler arguments
export type CodingAgentHandlerArgs = {
  event: EventPayload<CodingAgentFullEvent>
  step: Context["step"]
  logger: HandlerLogger // Use the imported type
}

export type AppInngest = Inngest // Or Inngest<Record<string, any>> for more flexibility

export type AppEvents = {
  "coding-agent/run": CodingAgentFullEvent // Используем CodingAgentFullEvent
  // Add other app-specific events here
}
