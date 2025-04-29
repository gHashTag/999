import { beforeEach, afterEach, mock, type Mock } from "bun:test"
import type { /* Sandbox, */ SandboxInfo, EntryInfo } from "e2b" // Removed Sandbox type import
// Define a simplified interface for SandboxInfo based on usage
interface MockSandboxInfo {
  sandboxId: string
  clientID: string
  templateID: string
  alias: string
  startedAt: Date
  // Add other fields like metadata, templateId, endAt if needed by tests
}
import { type SystemEventEmitter } from "@/utils/logic/systemEvents"
// import type { DeepSeekModelAdapter } from "@inngest/ai/models/deepseek" // Commenting out - likely incorrect path or missing dep
import type { Tool } from "@inngest/agent-kit"
// import { KVStore } from "@inngest/sdk" // Removed potentially incorrect import
import type { AgentDependencies, HandlerLogger } from "@/types/agents"
import { Agent /*, type State */ } from "@inngest/agent-kit"
import { TddNetworkState, NetworkStatus } from "@/types/network"
import { Readable } from "stream" // Import Readable for mocking read stream
import { EventEmitter } from "events"

// --- Constants ---
/** Mock API Key for tests */
export const mockApiKey = "test-api-key"
/** Mock Model Name for tests */
export const mockModelName = "test-model"
/** Mock Event ID for tests */
export const mockEventId = "test-event-id"

// --- Mock Implementations ---

// Logger Mocks
/** Mock function for logger.info */
export const mockInfo = mock<(...args: any[]) => void>(() => {})
/** Mock function for logger.warn */
export const mockWarn = mock<(...args: any[]) => void>(() => {})
/** Mock function for logger.error */
export const mockError = mock<(...args: any[]) => void>(() => {})
/** Mock function for logger.debug */
export const mockDebug = mock<(...args: any[]) => void>(() => {})
/** Mock function for logger.log */
export const mockLog = mock<(...args: any[]) => void>(() => {})

/** Centralized mock logger object implementing HandlerLogger interface */
export const mockLogger: HandlerLogger = {
  info: mockInfo,
  warn: mockWarn,
  error: mockError,
  debug: mockDebug,
  log: mockLog,
}

// KV Store Mock
/** Centralized mock KVStore object */
export const mockKv = {
  // Removed explicit KVStore type annotation
  get: mock<any>(() => Promise.resolve(undefined)), // Use any for generic mock methods
  set: mock<any>(() => Promise.resolve()),
  delete: mock<any>(() => Promise.resolve()),
  list: mock<any>(() => Promise.resolve([])),
  watch: mock<any>(() => {}),
  cas: mock<any>(() => Promise.resolve(false)),
  // Add other methods like 'scan', 'incr', etc. if the actual KVStore interface has them
}

// E2B Sandbox Mock
export const mockSandbox = {
  // Use simple mock() and cast if necessary
  runCode: mock().mockResolvedValue({
    stdout: "Mock code output",
    stderr: "",
    logs: [],
  }),
  files: {
    write: mock().mockResolvedValue(undefined), // write likely returns void/undefined, not EntryInfo[]
    read: mock().mockImplementation(async () => {
      const stream = new Readable()
      stream.push("Mock file content")
      stream.push(null)
      return stream
    }),
    list: mock().mockResolvedValue([] as EntryInfo[]),
    remove: mock().mockResolvedValue(undefined),
  },
  process: {
    start: mock().mockResolvedValue({
      runId: "mock-run-id",
      stdout: { on: mock(), removeAllListeners: mock() },
      stderr: { on: mock(), removeAllListeners: mock() },
      onExit: mock(),
      exited: Promise.resolve(),
      kill: mock(),
    } as any),
  },
  keepAlive: mock().mockResolvedValue(undefined),
  close: mock().mockResolvedValue(undefined),
  getInfo: mock().mockResolvedValue({
    sandboxId: "mock-sandbox-id",
    clientID: "mock-client-id",
    templateID: "mock-template-id",
    alias: "mock-alias",
    startedAt: new Date(),
  } as MockSandboxInfo), // Use the mock interface
} // Removed outer assertion

// System Events Mock
// Try mocking the class directly
export const mockSystemEvents = mock(
  EventEmitter
) as unknown as Mock<SystemEventEmitter> // Cast to the expected type
// We might not need to mock individual methods if mocking the class works
// mockSystemEvents.emit = mock();
// mockSystemEvents.on = mock();
// ... etc ...

// Deepseek Model Adapter Mock
interface MockableDeepSeekModelAdapter {
  adapterId: string
  request: (...args: any[]) => Promise<{ text: () => Promise<string> }>
}
export const mockDeepseekModelAdapter = {
  adapterId: "deepseek",
  request: mock<MockableDeepSeekModelAdapter["request"]>().mockResolvedValue({
    text: async () => "Mock LLM Response",
  }),
} as unknown as Mock<MockableDeepSeekModelAdapter> // Use interface for casting

// Tool Mocks
/** Map containing mock implementations for all tools */
export const mockTools: Map<string, Tool<any> & { handler: Mock<any> }> =
  new Map(
    [
      {
        name: "readFile",
        description: "Reads files",
        parameters: {} as any,
        handler: mock().mockResolvedValue("Mock file content"),
      },
      {
        name: "writeFile",
        description: "Writes files",
        parameters: {} as any,
        handler: mock().mockResolvedValue({ success: true }),
      },
      {
        name: "runTerminalCommand",
        description: "Runs terminal commands",
        parameters: {} as any,
        handler: mock().mockResolvedValue({ output: "Mock command output" }),
      },
      {
        name: "updateTaskState",
        description: "Updates task state",
        parameters: {} as any,
        handler: mock().mockResolvedValue({ success: true }),
      },
      {
        name: "web_search",
        description: "Performs web search",
        parameters: {} as any,
        handler: mock().mockResolvedValue({ results: "Mock search results" }),
      },
      {
        name: "edit_file",
        description: "Edits files",
        parameters: {} as any,
        handler: mock().mockResolvedValue({ success: true }),
      },
      // Add other tools as needed
    ].map(tool => [tool.name, tool as Tool<any> & { handler: Mock<any> }])
  )

// --- Setup and Teardown Hooks ---

/**
 * Resets all mocks before each test.
 * Ensures a clean state for mocks like logger and KV store.
 */
export const setupTestEnvironment = () => {
  // Reset individual mocks

  // Reset Logger Mocks
  mockInfo.mockClear()
  mockWarn.mockClear()
  mockError.mockClear()
  mockDebug.mockClear()
  mockLog.mockClear()

  // Reset KV Store Mocks
  mockKv.get.mockClear()
  mockKv.set.mockClear()
  mockKv.delete.mockClear()
  mockKv.list.mockClear()
  mockKv.watch.mockClear()
  mockKv.cas.mockClear()

  // Reset Sandbox Mocks
  mockSandbox.runCode.mockClear()
  mockSandbox.files.write.mockClear()
  mockSandbox.files.read.mockClear()
  mockSandbox.files.list.mockClear()
  mockSandbox.files.remove.mockClear()
  mockSandbox.process.start.mockClear()
  mockSandbox.keepAlive.mockClear()
  mockSandbox.close.mockClear()
  mockSandbox.getInfo.mockClear()

  // Reset System Events Mocks
  if (typeof mockSystemEvents.mockClear === "function") {
    mockSystemEvents.mockClear() // Clear the mock object itself if possible
  }
  // Or reset individual methods if the above doesn't work:
  // mockSystemEvents.emit?.mockClear();
  // mockSystemEvents.on?.mockClear();
  // ... etc ...

  // Reset Model adapter mock
  mockDeepseekModelAdapter.request.mockClear()

  // Reset all tool handler mocks
  mockTools.forEach(tool => {
    if (tool.handler && typeof tool.handler.mockClear === "function") {
      tool.handler.mockClear()
    }
  })

  // Restore implementations
  mockKv.get.mockImplementation(() => Promise.resolve(undefined))
  mockKv.set.mockImplementation(() => Promise.resolve())
  mockKv.delete.mockImplementation(() => Promise.resolve())
  mockKv.list.mockImplementation(() => Promise.resolve([]))
  mockKv.watch.mockImplementation(() => {})
  mockKv.cas.mockImplementation(() => Promise.resolve(false))

  // Restore LLM mock
  mockDeepseekModelAdapter.request.mockImplementation(() =>
    Promise.resolve({ text: async () => "Default Mock LLM Response" })
  )

  // Restore Sandbox mocks (example)
  mockSandbox.files.read.mockImplementation(async () => {
    const stream = new Readable()
    stream.push("Default mock file content")
    stream.push(null)
    return stream
  })
  // Add restores for other sandbox methods if needed
}

/**
 * Global beforeEach hook to automatically reset mocks.
 */
beforeEach(() => {
  setupTestEnvironment()
})

/**
 * Optional: Global afterEach hook for any additional cleanup.
 */
afterEach(() => {
  // Add any teardown logic needed after each test
})

// --- Helper Functions ---

/**
 * Creates a basic set of mock dependencies for tests.
 * @returns {AgentDependencies} A mock AgentDependencies object.
 */
export const createBaseMockDependencies = (): Omit<
  AgentDependencies,
  "sandboxId"
> => ({
  allTools: Array.from(mockTools.values()), // Provide all defined mock tools
  log: mockLogger, // Use the defined mock logger
  apiKey: mockApiKey,
  modelName: mockModelName,
  systemEvents: mockSystemEvents, // Use the defined mock system events
  eventId: mockEventId,
  agents: {}, // Initialize agents object
  model: mockDeepseekModelAdapter, // Use the defined mock model adapter
})

/**
 * Retrieves a specific mock tool handler from the central mockTools map.
 * Throws an error if the tool is not found.
 * @param {string} toolName The name of the tool to find.
 * @returns {Mock<any>} The mock handler function for the specified tool.
 */
export const findToolMock = (toolName: string): Mock<any> => {
  const tool = mockTools.get(toolName)
  if (!tool || !tool.handler) {
    throw new Error(`Mock tool handler for '${toolName}' not found.`)
  }
  return tool.handler
}

/**
 * Filters and returns a subset of mock tools based on the provided names.
 * @param {string[]} toolNames An array of tool names to include.
 * @returns {Tool<any>[]} An array of mock Tool objects.
 */
export const getMockTools = (toolNames: string[]): Tool<any>[] => {
  const selectedTools: Tool<any>[] = []
  for (const name of toolNames) {
    const tool = mockTools.get(name)
    if (tool) {
      selectedTools.push(tool)
    } else {
      console.warn(
        `[getMockTools] Mock tool '${name}' not found in mockTools map.`
      )
    }
  }
  return selectedTools
}

/**
 * Creates a simple mock agent for testing purposes.
 * @param {string} id The ID for the mock agent.
 * @param {string} name The name for the mock agent.
 * @returns {Agent<any>} A mock Agent object.
 */
export const createMockAgent = (id: string, name: string): Agent<any> => {
  return {
    id,
    name,
    // Add other necessary Agent properties/mocks if needed by tests
    ask: mock().mockResolvedValue({ output: `Mock response from ${name}` }),
  } as unknown as Agent<any>
}

// Define a default initial state for network tests
const defaultInitialState: TddNetworkState = {
  status: NetworkStatus.Enum.IDLE,
  task: "Initial task description",
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
// Ensure AgentDependencies is exported if it's defined here or re-exported
// If AgentDependencies is defined in @/types/agents, ensure IT is exported there.
// For now, assume it should be exported from here based on the error.
export type { AgentDependencies }

// Example export assuming HandlerLogger is defined or imported correctly
export type { HandlerLogger }
