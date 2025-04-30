import type { Tool, Agent } from "@inngest/agent-kit"
import { z } from "zod"
// import type { Sandbox as E2BSandboxType } from "e2b" // Removed old import
import type { EventPayload, Context } from "inngest"
import type { CodingAgentEvent } from "@/types/events"
// import type { systemEvents } from "@/utils/logic/systemEvents" // Unused
import { TddNetworkState } from "@/types/network"
// import type { Logger as PinoLogger } from "pino" // Replace PinoLogger with a simpler interface
import type { Sandbox as E2BSandbox } from "@e2b/sdk" // Import with alias again

// Base schema for agent roles
export const AgentRole = z.enum(["TESTER", "CODER", "CRITIC"])
export type AgentRole = z.infer<typeof AgentRole>

// /** Base logger type, potentially from Pino */
// export type BaseLogger = PinoLogger

/** Simplified Base Logger interface with essential methods */
export interface BaseLogger {
  info: (message: string, ...args: unknown[]) => void
  error: (message: string, ...args: unknown[]) => void
  warn: (message: string, ...args: unknown[]) => void
  debug: (message: string, ...args: unknown[]) => void
  fatal: (message: string, ...args: unknown[]) => void // Keep fatal/trace if used by dependencies
  trace: (message: string, ...args: unknown[]) => void
  silent: (message: string, ...args: unknown[]) => void // Keep silent if needed
  level: string | number // Keep level if needed
  // Add other methods ONLY if they are strictly required by dependencies interacting with this type
  child: (bindings: Record<string, unknown>) => BaseLogger // Keep child if necessary
}

/** Type for the logger passed specifically to tool handlers */
export type HandlerLogger = Pick<
  BaseLogger,
  "info" | "error" | "warn" | "debug"
>

/**
 * Generic function type for logging messages.
 * Allows any number of arguments of unknown type.
 */
export type LoggerFunc = (message: string, ...args: unknown[]) => void

/** Represents the structure for storing agent states or data */
export interface KvStore {
  get: <T = unknown>(key: string) => Promise<T | undefined>
  set: <T = unknown>(key: string, value: T) => Promise<void>
  delete: (key: string) => Promise<boolean>
  has?: (key: string) => Promise<boolean>
  all?: () => Promise<Record<string, unknown>>
}

/** Represents the Sandbox environment for code execution */
export type Sandbox = E2BSandbox // Use the alias

/** System-level events or signals */
export interface SystemEvents {
  emit: (event: string, payload: Record<string, unknown>) => Promise<void>
}

// Dependencies needed for agent creation
export interface AgentDependencies {
  allTools: Tool<any>[]
  log: BaseLogger
  apiKey: string
  modelName: string
  systemEvents: SystemEvents
  sandbox: Sandbox | null
  eventId: string
  agents?: Record<string, Agent<any>>
  kv?: KvStore
  model?: any // Add optional model property (type can be refined later)
}

// Helper type for critique data extraction
export interface CritiqueData {
  critique?: string
  needsRevision?: boolean
  isApproved?: boolean
  error?: string
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

// Interface describing the structure of the agents object
export interface Agents {
  teamLead: Agent<TddNetworkState>
  tester: Agent<TddNetworkState>
  coder: Agent<TddNetworkState>
  critic: Agent<TddNetworkState>
  tooling: Agent<TddNetworkState>
}

// FIX: Define AvailableAgent interface
export interface AvailableAgent {
  name: string
  instructionPath: string
  tools: Tool<any>[] // Agents available for selection might have tools
}

// Properties specifically needed during agent *creation*
// (Separated to avoid passing instructions into AgentDependencies where it might not belong)
export interface AgentCreationProps {
  instructions: string
}

/**
 * Dependencies specifically for tool handlers.
 * Contains only the necessary parts from AgentDependencies.
 */
export interface ToolHandlerDependencies {
  log: HandlerLogger
  apiKey: string
  modelName: string
  systemEvents: SystemEvents
  sandbox: Sandbox | null
  eventId: string
  kv?: KvStore
}

/** Basic Agent interface (can be expanded) */
export interface BasicAgent {
  name: string
  description: string
  ask: (prompt: string, opts?: Record<string, unknown>) => Promise<string>
  send?: (message: unknown) => Promise<void>
  tools?: Map<string, Tool<any>>
}
