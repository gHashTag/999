import { mock, type Mock } from "bun:test"
import { beforeEach } from "bun:test" // Import beforeEach for the hook
import { createTool, type Tool as AgentKitTool } from "@inngest/agent-kit"
import { Agent /*, type State */ } from "@inngest/agent-kit"
import type {
  HandlerLogger,
  AgentDependencies as InternalAgentDependencies,
} from "@/types/agents" // Keep internal AgentDependencies alias
import { TddNetworkState, NetworkStatus } from "@/types/network"
import { z } from "zod"
import { systemEvents as realSystemEvents } from "@/utils/logic/systemEvents" // Import real systemEvents to get its type

// --- Central Mock Definitions ---

// Re-export the AgentDependencies type
export type AgentDependencies = InternalAgentDependencies

// Mock Logger - Explicitly mock each method
export const mockInfo = mock(() => {})
export const mockWarn = mock(() => {})
export const mockError = mock(() => {})
export const mockDebug = mock(() => {})
export const mockLog = mock(() => {})

export const mockLogger: HandlerLogger = {
  info: mockInfo,
  warn: mockWarn,
  error: mockError,
  debug: mockDebug,
  log: mockLog,
} // Removed unnecessary cast

// Mock KV Store (in-memory for tests)
let mockKvStore = new Map<string, any>()
export const mockKv = {
  get: mock((key: string) => mockKvStore.get(key)),
  set: mock((key: string, value: any) => {
    mockKvStore.set(key, value)
  }),
  all: mock(() => Object.fromEntries(mockKvStore)),
  delete: mock((key: string) => mockKvStore.delete(key)),
  has: mock((key: string) => mockKvStore.has(key)),
}

// Mock System Events Emitter
export const mockSystemEvents = {
  emit: mock(),
  addListener: mock(), // Added mock for addListener if used by systemEvents type
  removeAllListeners: mock(), // Added mock for removeAllListeners if used by systemEvents type
} as unknown as typeof realSystemEvents // Keep cast for now

// Mock Constants
export let mockApiKey = "test-api-key" // Use let for potential reset in setup
export let mockModelName = "test-model"
export let mockEventId = "test-event-id"

// Mock AI Model Adapter (Placeholder/Basic Mock)
// Make it closer to AiAdapter.Any or use `as any` deliberately
export const mockDeepseekModelAdapter = {
  id: "mock-deepseek",
  request: mock().mockResolvedValue({}), // Ensure request is a mock function
  // Add dummy properties to resemble AiAdapter.Any or accept using `as any`
  format: "testing-format",
  options: {},
  authKey: "test-auth",
  "~types": {},
} as any // Using 'as any' to bypass strict type checking for the mock

// Real Deepseek Model Adapter (Placeholder/Stub for Integration Tests)
// Requires environment variables DEEPSEEK_API_KEY and DEEPSEEK_MODEL
export let realDeepseekApiKey =
  process.env.DEEPSEEK_API_KEY || "dummy-key-for-test"
export let realDeepseekModelName =
  process.env.DEEPSEEK_MODEL || "deepseek-coder"
export const realDeepseekModelAdapter = {
  name: "real-deepseek-model-adapter",
  id: "real-deepseek-model-adapter-id",
  apiKey: realDeepseekApiKey,
  model: realDeepseekModelName,
  request: mock(() =>
    Promise.resolve({
      text: async () => "Real LLM Response Placeholder",
      usage: { promptTokens: 10, completionTokens: 5 },
      finishReason: "stop",
      raw: {},
    })
  ),
  config: {},
  client: {},
} as any // Use 'as any' for simplicity

// --- Central Mock Tools ---

// Define mock implementations for common tools
const mockToolImplementations: {
  [key: string]: (...args: any[]) => Promise<any>
} = {
  web_search: mock(() => Promise.resolve({ results: "Mock search results" })),
  updateTaskState: mock(() => Promise.resolve({ success: true })),
  readFile: mock(() => Promise.resolve({ content: "Mock file content" })),
  writeFile: mock(() => Promise.resolve({ success: true })),
  runTerminalCommand: mock(() =>
    Promise.resolve({ output: "mock terminal output", exitCode: 0 })
  ),
  runCommand: mock(() =>
    Promise.resolve({ output: "mock runCommand output", exitCode: 0 })
  ),
  edit_file: mock(() => Promise.resolve({ success: true })),
  codebase_search: mock(() => Promise.resolve({ results: [] })),
  grep_search: mock(() => Promise.resolve({ results: [] })),
  // Add mock MCP tools for testing filtering
  "mcp_cli-mcp-server_run_command": mock(() =>
    Promise.resolve({ output: "mcp command output" })
  ),
  "mcp_cli-mcp-server_show_security_rules": mock(() =>
    Promise.resolve({ rules: "mock security rules" })
  ),
}

// Create mock tools using createTool
export const mockTools: AgentKitTool<any>[] = Object.entries(
  mockToolImplementations
).map(([name, handler]) =>
  createTool({
    name,
    description: `Mock tool for ${name}`,
    parameters: z.object({}),
    handler,
  })
)

// Helper function to add a tool dynamically if needed during tests
// (Be careful with this, prefer defining all mocks upfront)
export function addMockTool(
  name: string,
  handler: (...args: any[]) => Promise<any>
) {
  const existingTool = mockTools.find(tool => tool.name === name)
  if (existingTool) {
    console.warn(`Mock tool "${name}" already exists. Overwriting handler.`)
    existingTool.handler = handler
  } else {
    mockTools.push(
      createTool({
        name,
        description: `Dynamically added mock tool: ${name}`,
        parameters: z.object({}), // Generic parameters
        handler,
      })
    )
  }
}

// --- Test Environment Setup ---

export function setupTestEnvironmentFocused() {
  // Reset logger mocks
  mockInfo.mockClear()
  mockWarn.mockClear()
  mockError.mockClear()
  mockDebug.mockClear()
  mockLog.mockClear()

  // Reset KV mocks (implementation and calls)
  mockKvStore = new Map<string, any>() // Clear the in-memory store
  mockKv.get.mockClear()
  mockKv.set.mockClear()
  mockKv.all.mockClear()
  mockKv.delete.mockClear()
  mockKv.has.mockClear()
  // Reset implementations to default (if they were changed in tests)
  mockKv.get.mockImplementation((key: string) => mockKvStore.get(key))
  mockKv.set.mockImplementation((key: string, value: any) => {
    mockKvStore.set(key, value)
  })
  mockKv.all.mockImplementation(() => Object.fromEntries(mockKvStore))
  mockKv.delete.mockImplementation((key: string) => mockKvStore.delete(key))
  mockKv.has.mockImplementation((key: string) => mockKvStore.has(key))

  // Reset system event mocks
  if ((mockSystemEvents.emit as Mock<any>).mockClear) {
    ;(mockSystemEvents.emit as Mock<any>).mockClear()
  }
  if ((mockSystemEvents.addListener as Mock<any>).mockClear) {
    ;(mockSystemEvents.addListener as Mock<any>).mockClear()
  }
  if ((mockSystemEvents.removeAllListeners as Mock<any>).mockClear) {
    ;(mockSystemEvents.removeAllListeners as Mock<any>).mockClear()
  }

  // Reset tool mocks
  mockTools.forEach(tool => {
    if ((tool.handler as Mock<any>).mockClear) {
      ;(tool.handler as Mock<any>).mockClear()
      // Reset implementation if needed, e.g., back to default promise
      if (mockToolImplementations[tool.name]) {
        ;(tool.handler as Mock<any>).mockImplementation(
          mockToolImplementations[tool.name]
        )
      }
    }
  })

  // Reset AI model mocks
  if (mockDeepseekModelAdapter.request.mockClear) {
    mockDeepseekModelAdapter.request.mockClear()
    // Reset implementation to default if needed
    mockDeepseekModelAdapter.request.mockImplementation(() =>
      Promise.resolve({})
    )
  }
  if (realDeepseekModelAdapter.request.mockClear) {
    realDeepseekModelAdapter.request.mockClear()
    // Reset implementation to default placeholder if needed
    realDeepseekModelAdapter.request.mockImplementation(() =>
      Promise.resolve({
        text: async () => "Real LLM Response Placeholder",
        usage: { promptTokens: 10, completionTokens: 5 },
        finishReason: "stop",
        raw: {},
      })
    )
  }

  // Reset constants (if mutable)
  mockApiKey = "test-api-key"
  mockModelName = "test-model"
  mockEventId = "test-event-id"
  realDeepseekApiKey = process.env.DEEPSEEK_API_KEY || "dummy-key-for-test"
  realDeepseekModelName = process.env.DEEPSEEK_MODEL || "deepseek-coder"
  realDeepseekModelAdapter.apiKey = realDeepseekApiKey
  realDeepseekModelAdapter.model = realDeepseekModelName
}

// Call setup before each test using bun's hook
beforeEach(() => {
  setupTestEnvironmentFocused()
})

// --- Helper Functions ---

/**
 * Creates a *complete* base set of mock dependencies suitable for AgentDependencies type.
 * Tests can override specific fields if needed.
 */
export const createBaseMockDependencies = (): AgentDependencies => {
  return {
    allTools: mockTools, // Use the existing mockTools array
    log: mockLogger, // Use the existing mockLogger
    apiKey: mockApiKey,
    modelName: mockModelName,
    systemEvents: mockSystemEvents,
    sandbox: null, // Default sandbox to null for unit tests
    eventId: mockEventId,
    // agents: {}, // Agents are typically added per-test, not in base deps
    model: mockDeepseekModelAdapter, // Use the mocked model adapter
  }
}

/**
 * Finds a mock tool by name from the central mockTools array.
 * Uses tool.name for matching.
 * @param name The name of the tool to find.
 * @returns The mock handler function of the tool.
 * @throws Error if the tool is not found.
 */
export function findToolMock(name: string): Mock<any> | undefined {
  const tool = mockTools.find(t => t.name === name) // Use t.name
  // Ensure the handler is actually a mock function
  return tool?.handler as Mock<any> | undefined
}

/**
 * Gets a filtered list of mock tools by name.
 * Uses tool.name for matching.
 * @param names - An array of tool names to retrieve.
 * @returns An array of the requested mock tools.
 * @throws Error if any requested tool is not found.
 */
export function getMockTools(names: string[]): AgentKitTool<any>[] {
  return mockTools.filter(t => names.includes(t.name)) // Use t.name
}

/**
 * Creates a mock Agent object for testing purposes.
 */
export function createMockAgent(name: string, description = ""): Agent<any> {
  // Return an object that structurally resembles Agent<any> for mocking purposes
  // Or use `as unknown as Agent<any>` if full mocking is complex
  return {
    name: name,
    description: description || `Mock agent: ${name}`,
    definition: {
      // Add definition property expected by some tests
      name: name,
      description: description || `Mock agent: ${name}`,
      id: name, // Use name as id for mock
      tools: new Map(),
      model: mockDeepseekModelAdapter,
      system: `Mock system prompt for ${name}`,
    },
    model: mockDeepseekModelAdapter,
    system: `Mock system prompt for ${name}`,
    tools: new Map(),
    // Add other necessary Agent properties/methods as mocks if needed by tests
    // e.g., send: mock(), if tests call agent.send()
  } as unknown as Agent<any> // Cast to bypass strict type check for mock
}

/**
 * Creates a mock network state object.
 */
export function createMockNetworkState(
  initialData?: Partial<TddNetworkState>
): TddNetworkState {
  return {
    status: NetworkStatus.Enum.IDLE,
    task: "Mock Task",
    sandboxId: "mock-sandbox-id",
    run_id: "mock-run-id",
    ...initialData,
  }
}
