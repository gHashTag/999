import type { Tool as AgentKitTool, Agent } from "@inngest/agent-kit"
import { z } from "zod"
import { type Sandbox } from "e2b"
import type { EventPayload, Context } from "inngest"
import type { CodingAgentEvent } from "@/types/events"
import type { systemEvents } from "@/utils/logic/systemEvents"
import { TddNetworkState } from "@/types/network"

// Base schema for agent roles
export const AgentRole = z.enum(["TESTER", "CODER", "CRITIC"])
export type AgentRole = z.infer<typeof AgentRole>

// Logger function type
export type HandlerLogger = {
  info: (...args: unknown[]) => void
  error: (...args: unknown[]) => void
  warn: (...args: unknown[]) => void
  debug: (...args: unknown[]) => void
  log: (...args: unknown[]) => void
}

// FIX: Use Tool<any> for broad compatibility
export type AnyTool = AgentKitTool<any>

// Dependencies needed for agent creation
export interface AgentDependencies {
  allTools: AnyTool[]
  log: HandlerLogger
  apiKey: string
  modelName: string
  systemEvents: typeof systemEvents
  sandbox: Sandbox | null
  agents?: {
    teamLead: Agent<TddNetworkState>
    tester: Agent<TddNetworkState>
    coder: Agent<TddNetworkState>
    critic: Agent<TddNetworkState>
    tooling: Agent<TddNetworkState>
  }
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
  tools: AnyTool[] // Agents available for selection might have tools
}
