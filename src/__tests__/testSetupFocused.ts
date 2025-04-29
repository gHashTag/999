import { mock, type Mock } from "bun:test"
import { beforeEach } from "bun:test" // Import beforeEach for the hook
import EventEmitter from "events"
import { createTool, type Tool } from "@inngest/agent-kit"
import { Agent /*, type State */ } from "@inngest/agent-kit"
import type { AgentDependencies, HandlerLogger } from "@/types/agents"
import { TddNetworkState, NetworkStatus } from "@/types/network"
import { z } from "zod"

// --- Central Mock Definitions ---

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
} // Remove cast 'as unknown as HandlerLogger' for now, ensure HandlerLogger type matches

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
export const mockSystemEvents = new EventEmitter()

// Mock Constants
export let mockApiKey = "test-api-key" // Use let for potential reset in setup
export let mockModelName = "test-model"
export let mockEventId = "test-event-id"

// Mock AI Model Adapter (Placeholder/Basic Mock)
export const mockDeepseekModelAdapter = {
  name: "mock-deepseek-model",
  id: "mock-deepseek-model-adapter-id",
  request: mock(() =>
    /*messages: Array<Record<string, any>>,*/
    /*options?: Record<string, any>*/
    Promise.resolve({
      text: async () => "Mock LLM Response",
      usage: { promptTokens: 10, completionTokens: 5 },
      finishReason: "stop",
      raw: {},
    })
  ),
  config: {},
  client: {},
} as any // Use 'as any' for simplicity

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
    /*messages: Array<Record<string, any>>,*/
    /*options?: Record<string, any>*/
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
}

// Create mock tools using createTool
export const mockTools: Tool<any>[] = Object.entries(
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

  // Reset system event listeners and calls
  mockSystemEvents.removeAllListeners()
  // If SystemEvents methods are mocks themselves (they should be)
  if ((mockSystemEvents.emit as Mock<any>).mockClear) {
    ;(mockSystemEvents.emit as Mock<any>).mockClear()
    ;(mockSystemEvents.addListener as Mock<any>).mockClear()
    // ... clear other event emitter mocks if needed
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
      /*messages: Array<Record<string, any>>,*/
      /*options?: Record<string, any>*/
      Promise.resolve({
        text: async () => "Mock LLM Response",
        usage: { promptTokens: 10, completionTokens: 5 },
        finishReason: "stop",
        raw: {},
      })
    )
  }
  if (realDeepseekModelAdapter.request.mockClear) {
    realDeepseekModelAdapter.request.mockClear()
    // Reset implementation to default placeholder if needed
    realDeepseekModelAdapter.request.mockImplementation(() =>
      /*messages: Array<Record<string, any>>,*/
      /*options?: Record<string, any>*/
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
} // THIS IS THE CORRECT ENDING BRACE FOR THE FUNCTION

// Call setup before each test using bun's hook
beforeEach(() => {
  setupTestEnvironmentFocused()
})

// --- Helper Functions ---

/**
 * Creates a *complete* base set of mock dependencies suitable for AgentDependencies type.
 * Tests can override specific fields if needed.
 */
export function createBaseMockDependencies(): AgentDependencies {
  return {
    apiKey: mockApiKey,
    modelName: mockModelName,
    kv: mockKv, // Included kv
    log: mockLogger, // Included log
    model: mockDeepseekModelAdapter, // Included model
    systemEvents: mockSystemEvents,
    sandbox: null,
    eventId: mockEventId,
    allTools: [], // Default to empty
    agents: {}, // Default to empty
  }
}

/**
 * Retrieves a specific mock tool instance by name.
 * Useful for asserting calls on a specific tool's handler.
 * @throws Error if the tool is not found.
 */
export function findToolMock(name: string): Tool<any> {
  const tool = mockTools.find(tool => tool.name === name)
  if (!tool) {
    throw new Error(
      `Mock tool with name "${name}" not found in mockTools array.`
    )
  }
  return tool
}

/**
 * Filters the central mock tools to provide only the specified tools.
 * @throws Error if any requested tool name is not found.
 */
export function getMockTools(names: string[]): Tool<any>[] {
  return names.map(name => {
    const tool = mockTools.find(t => t.name === name)
    if (!tool) {
      throw new Error(
        `Mock tool with name "${name}" not found in central mockTools array.`
      )
    }
    return tool
  })
}

/**
 * Creates a simplified mock agent object for testing network routing etc.
 */
export function createMockAgent(
  id: string, // Use id to match network map keys
  name: string,
  description = ""
): Agent<any> {
  return {
    id, // Agent id (e.g., "agent-teamlead")
    name, // Agent name (e.g., "TeamLead Agent")
    description,
    ask: mock((/*input: string, opts: any*/) =>
      Promise.resolve(`Mock response from ${name}`)),
    tools: new Map<string, Tool<any>>(), // Use Tool<any> for map value
    system: `System prompt for mock agent: ${name}`, // Basic system prompt
    definition: {
      name: id,
      description: description || `Mock definition for ${name}`,
      defaultModel: mockDeepseekModelAdapter, // Can use mock model
      tools: [], // Mock agents usually don't need tools defined here
    },
  } as unknown as Agent<any> // Use cast carefully
}

// Define a default initial state for network tests
const defaultInitialState: TddNetworkState = {
  status: NetworkStatus.Enum.IDLE,
  task: "Initial task description",
  sandboxId: "default-sandbox-id",
  run_id: "initial-run-id",
  test_requirements: undefined,
  command_to_execute: undefined,
  test_code: undefined,
  implementation_code: undefined,
  requirements_critique: undefined,
  test_critique: undefined,
  implementation_critique: undefined,
  last_command_output: undefined,
  first_failing_test: undefined,
  error: undefined,
}

/**
 * Creates an initial network state, merging defaults with provided data.
 */
export function createMockNetworkState(
  initialData?: Partial<TddNetworkState>
): TddNetworkState {
  // Make a deep copy of the default state
  const state: TddNetworkState = JSON.parse(JSON.stringify(defaultInitialState))
  // Merge provided data
  if (initialData) {
    for (const key in initialData) {
      if (Object.prototype.hasOwnProperty.call(initialData, key)) {
        // Use type assertion for safety
        state[key as keyof TddNetworkState] = initialData[
          key as keyof TddNetworkState
        ] as any
      }
    }
  }
  return state
}
