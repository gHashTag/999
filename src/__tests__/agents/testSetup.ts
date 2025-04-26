import { vi } from "vitest"
import { EventEmitter } from "events"
import { type AnyTool, type HandlerLogger } from "@/types/agents"
import { type AgentDependencies as _AgentDependencies } from "@/types/agents"
import { deepseek } from "@inngest/ai/models"
import type {
  AgentResult,
  NetworkRun as _NetworkRun,
  Tool,
  Agent,
} from "@inngest/agent-kit"
import { type TddNetworkState, NetworkStatus } from "@/types/network"

// Mock logger
export const mockLog: HandlerLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
}

// Mock constants
export const mockApiKey = "test-api-key"
export const mockModelName = "test-model"
export const mockSystemEvents = new EventEmitter()

// Mock tools array
export const mockTools: AnyTool[] = [
  {
    name: "createOrUpdateFiles",
    description: "mock",
    parameters: {},
    handler: vi.fn(),
  },
  {
    name: "terminal",
    description: "mock",
    parameters: {},
    handler: vi.fn(),
  },
  {
    name: "readFiles",
    description: "mock",
    parameters: {},
    handler: vi.fn(),
  },
  {
    name: "askHumanForInput",
    description: "mock",
    parameters: {},
    handler: vi.fn(),
  },
  {
    name: "web_search",
    description: "mock",
    parameters: {},
    handler: vi.fn(),
  },
  {
    name: "codebase_search",
    description: "mock",
    parameters: {},
    handler: vi.fn(),
  },
  {
    name: "grep_search",
    description: "mock",
    parameters: {},
    handler: vi.fn(),
  },
  {
    name: "edit_file",
    description: "mock",
    parameters: {},
    handler: vi.fn(),
  },
  {
    name: "read_file",
    description: "mock",
    parameters: {},
    handler: vi.fn(),
  },
]

// Mock AgentDependencies
export const mockAgentDeps: _AgentDependencies = {
  allTools: mockTools,
  log: mockLog,
  apiKey: mockApiKey,
  modelName: mockModelName,
  sandbox: null, // Assuming sandbox can be null for these tests
  systemEvents: mockSystemEvents,
}

// Mock Tool Options Helper
// Note: mockStep needs to be defined if used by any tool handler tests
const mockStep = undefined // Define or import a proper mock if needed

export const mockToolOptions = (
  mockAgent: Agent<TddNetworkState>,
  mockNetwork: _NetworkRun<TddNetworkState>
): Tool.Options<TddNetworkState> => {
  return {
    agent: mockAgent,
    network: mockNetwork,
    step: mockStep,
  }
}

// Mock deepseek model
vi.mock("@inngest/ai/models", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  deepseek: vi.fn().mockReturnValue({ client: { api: "deepseek" } } as any),
}))

// Setup function for beforeEach
export function setupTestEnvironment() {
  vi.resetAllMocks()
  // Re-apply mock return value for deepseek after reset
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  vi.mocked(deepseek).mockReturnValue({ client: { api: "deepseek" } } as any)
}

// Re-export common types/values needed by tests
export {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  beforeAll,
  afterAll,
} from "vitest"
export { type _AgentDependencies, type AnyTool, type HandlerLogger }
export { type AgentResult, type _NetworkRun, type Tool, type Agent }
export { EventEmitter }
export { type TddNetworkState, NetworkStatus }
export { deepseek }
