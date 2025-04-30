import {
  createTeamLeadAgent,
  createTesterAgent,
  createCoderAgent,
  createCriticAgent,
  createToolingAgent,
  createOpenCodexAgent,
} from "@/agents"
import { appLog /*, systemEvents*/ } from "@/utils/logic"
import { getAllTools } from "@/tools/toolDefinitions"
// import { Tool } from "@inngest/agent-kit"
import type {
  AgentDependencies,
  BaseLogger,
  KvStore,
  // Sandbox,
  SystemEvents,
} from "@/types/agents"
import { Sandbox } from "@e2b/sdk"

// Mock dependencies for CLI usage
const mockApiKey = process.env.DEEPSEEK_API_KEY || "mock-api-key"
const mockModelName = process.env.DEEPSEEK_MODEL_NAME || "deepseek-coder"
const mockEventId = "cli-event"

const mockSandbox = new Sandbox({ apiKey: process.env.E2B_API_KEY })

// Simple in-memory KV for CLI
const cliKvStore: KvStore = {
  data: {} as Record<string, any>,
  async get<T = unknown>(key: string): Promise<T | undefined> {
    return this.data[key] as T | undefined
  },
  async set<T = unknown>(key: string, value: T): Promise<void> {
    this.data[key] = value
  },
  async delete(key: string): Promise<boolean> {
    const exists = key in this.data
    delete this.data[key]
    return exists
  },
  async has(key: string): Promise<boolean> {
    return key in this.data
  },
  async all(): Promise<Record<string, unknown>> {
    return { ...this.data }
  },
}

const baseDeps: Omit<AgentDependencies, "allTools" | "agents"> = {
  apiKey: mockApiKey,
  modelName: mockModelName,
  systemEvents: null, // System events are not used in direct CLI chat
  sandbox: mockSandbox,
  eventId: mockEventId,
  log: appLog as BaseLogger,
  kv: cliKvStore,
  model: null, // Agents will create their own model instance if needed
}

const allTools = getAllTools(baseDeps as any)

export const cliAgentDependencies: AgentDependencies = {
  ...baseDeps,
  allTools: allTools,
  agents: {}, // No inter-agent communication needed for basic chat
}

// Create agent instances
export const teamLead = createTeamLeadAgent(
  cliAgentDependencies,
  "You are a helpful assistant."
)
export const tester = createTesterAgent(
  cliAgentDependencies,
  "You write tests based on requirements."
)
export const coder = createCoderAgent(
  cliAgentDependencies,
  "You write code to pass tests."
)
export const critic = createCriticAgent(
  cliAgentDependencies,
  "You review code and tests."
)
export const tooling = createToolingAgent(
  cliAgentDependencies,
  "You execute commands and scripts."
)
export const openCodex = createOpenCodexAgent(
  cliAgentDependencies,
  "You interact with Open Codex."
)

export const agents: Record<string, any> = {
  teamlead: teamLead,
  tester: tester,
  coder: coder,
  critic: critic,
  tooling: tooling,
  opencodex: openCodex,
}
