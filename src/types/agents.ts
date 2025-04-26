import type { Tool } from "@inngest/agent-kit"
import { z } from "zod"
import { type Sandbox } from "@e2b/sdk"
import type EventEmitter from "events"
import type { EventPayload, Context } from "inngest"
import type { CodingAgentEvent } from "@/types/events"

// Base schema for agent roles
export const AgentRole = z.enum(["TESTER", "CODER", "CRITIC"])
export type AgentRole = z.infer<typeof AgentRole>

// Logger function type
export type LoggerFunc = (
  level: "info" | "warn" | "error",
  stepName: string,
  message: string,
  data?: object
) => void

// General Tool type (from agent-kit), revert to any for now
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyTool = Tool<any>

// Dependencies needed for agent creation
export interface AgentDependencies {
  allTools: AnyTool[]
  log: HandlerLogger
  apiKey: string
  modelName: string
  systemEvents: EventEmitter
  sandbox?: Sandbox | null | undefined
}

// Helper type for critique data extraction
export interface CritiqueData {
  critique?: string
  needsRevision?: boolean
  isApproved?: boolean
  error?: string
}

// Define Logger interface locally based on observed .d.ts
export interface HandlerLogger {
  info(...args: unknown[]): void
  warn(...args: unknown[]): void
  error(...args: unknown[]): void
  debug(...args: unknown[]): void
}

// Define the type for the handler arguments
export type CodingAgentHandlerArgs = {
  event: EventPayload<CodingAgentEvent>
  step: Context["step"]
  logger: HandlerLogger
}

export type NetworkStatus = {
  status: string
}
