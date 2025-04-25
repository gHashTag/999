import type { Tool } from "@inngest/agent-kit"
import { z } from "zod"

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

// General Tool type (from agent-kit)
export type AnyTool = Tool<any>

// Dependencies needed for agent creation
export interface AgentDependencies {
  allTools: AnyTool[]
  log: LoggerFunc
  apiKey: string
  modelName: string
}

// Helper type for critique data extraction
export interface CritiqueData {
  critique?: string
  needsRevision?: boolean
  isApproved?: boolean
  error?: string
}
