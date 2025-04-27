import { type Context, type EventPayload } from "inngest"
import { CodingAgentEvent } from "./events" // Assuming events.ts is in the same directory
// Import the unified HandlerLogger using alias
import { HandlerLogger } from "@/types/agents" // FIX: Use alias

// Logger interface used within Inngest handlers -- REMOVED
// export interface HandlerLogger {
//   info(...args: unknown[]): void
//   warn(...args: unknown[]): void
//   error(...args: unknown[]): void
//   debug(...args: unknown[]): void
// }

// Type for the main codingAgentHandler arguments
export type CodingAgentHandlerArgs = {
  event: EventPayload<CodingAgentEvent>
  step: Context["step"]
  logger: HandlerLogger // Use the imported type
}
