import { mock } from "bun:test"
import { beforeEach } from "bun:test"
import type { AgentDependencies as AgentDependenciesType } from "@/types/agents"
import type { Tool as AnyTool } from "@inngest/agent-kit"
import type { BaseLogger, KvStore, SystemEvents, Sandbox } from "@/types/agents"

// --- Central Mock Definitions ---

// Re-export the AgentDependencies type
export type AgentDependencies = AgentDependenciesType

// Mock Logger
export const mockInfo = mock<(...args: unknown[]) => void>()
export const mockError = mock<(...args: unknown[]) => void>()
export const mockWarn = mock<(...args: unknown[]) => void>()
export const mockDebug = mock<(...args: unknown[]) => void>()
export const mockLogger: BaseLogger = {
  info: mockInfo,
  error: mockError,
  warn: mockWarn,
  debug: mockDebug,
  fatal: mock<(...args: unknown[]) => void>(),
  trace: mock<(...args: unknown[]) => void>(),
  silent: mock<(...args: unknown[]) => void>(),
  level: "info",
  child: mock(() => mockLogger as any),
}

// Mock KV Store
export const mockKvStoreData: Record<string, unknown> = {}
export const mockKvGet = mock(
  <T = unknown>(key: string): Promise<T | undefined> =>
    Promise.resolve(mockKvStoreData[key] as T | undefined)
)
export const mockKvSet = mock(
  <T = unknown>(key: string, value: T): Promise<void> => {
    console.log(`[DEBUG mockKvSet] Setting key: ${key}, value:`, value)
    mockKvStoreData[key] = value
    return Promise.resolve()
  }
)
export const mockKvDelete = mock((key: string): Promise<boolean> => {
  const exists = key in mockKvStoreData
  delete mockKvStoreData[key]
  return Promise.resolve(exists)
})
export const mockKvHas = mock((key: string): Promise<boolean> => {
  return Promise.resolve(key in mockKvStoreData)
})
export const mockKvAll = mock(
  (): Promise<Record<string, unknown>> =>
    Promise.resolve({ ...mockKvStoreData })
)

export const mockKv: KvStore = {
  get: mockKvGet as <T = unknown>(key: string) => Promise<T | undefined>,
  set: mockKvSet,
  delete: mockKvDelete,
  has: mockKvHas,
  all: mockKvAll,
}

// Mock SystemEvents
export const mockEmit = mock(
  (_event: string, _payload: Record<string, unknown>): Promise<void> => {
    return Promise.resolve()
  }
)
export const mockSystemEvents: SystemEvents = {
  emit: mockEmit,
}

// Mock Sandbox
export const mockSandboxFilesRead = mock<(path: string) => Promise<string>>(
  async path => `Mock content for ${path}`
)
export const mockSandboxFilesWrite = mock<
  (path: string, content: string) => Promise<void>
>(async () => {})
export const mockSandboxFilesList = mock(async () => [])
export const mockSandboxFilesRemove = mock(async () => {})

export const mockSandboxProcessStart = mock(async () => ({
  exited: Promise.resolve(0),
  output: { stdout: "", stderr: "" },
  kill: mock(async () => {}),
  sendStdin: mock(async () => {}),
  onStdout: mock(() => () => {}),
  onStderr: mock(() => () => {}),
  onExit: mock(() => () => {}),
}))
export const mockSandboxProcessStartAndWait = mock(async () => ({
  stdout: "",
  stderr: "",
  exitCode: 0,
}))

export const mockSandbox: Sandbox = {
  filesystem: {
    read: mockSandboxFilesRead,
    write: mockSandboxFilesWrite,
    list: mockSandboxFilesList,
    remove: mockSandboxFilesRemove,
  },
  process: {
    start: mockSandboxProcessStart,
    startAndWait: mockSandboxProcessStartAndWait,
  },
  id: "mock-sandbox-id",
} as unknown as Sandbox

// Mock Model Adapter (DeepSeek)
export const mockModelRequest = mock(
  async (/*prompt: string, opts?: unknown*/) => ({
    result: "Mock LLM response",
  })
)
export const mockDeepseekModelAdapter = {
  request: mockModelRequest,
}

// Default Mock Dependencies
export const mockApiKey = "test-api-key"
export const mockModelName = "test-model"
export const mockEventId = "test-event-id"

// Function to create full AgentDependencies with defaults
export function createFullMockDependencies(
  overrides: Partial<AgentDependencies> = {}
): AgentDependencies {
  return {
    apiKey: mockApiKey,
    modelName: mockModelName,
    systemEvents: mockSystemEvents,
    sandbox: mockSandbox,
    eventId: mockEventId,
    log: mockLogger,
    allTools: mockTools,
    kv: mockKv,
    model: mockDeepseekModelAdapter,
    agents: {},
    ...overrides,
  }
}

// Mock Tools
export const mockReadFileHandler = mock<
  (...args: unknown[]) => Promise<unknown>
>(async () => ({ files: [{ path: "mock.txt", content: "mock read content" }] }))
export const mockWriteFileHandler = mock<
  (...args: unknown[]) => Promise<unknown>
>(async () => ({ success: true }))
export const mockRunCommandHandler = mock<
  (...args: unknown[]) => Promise<unknown>
>(async () => ({ output: "mock command output" }))
export const mockUpdateTaskStateHandler = mock<
  (...args: unknown[]) => Promise<unknown>
>(async () => ({ success: true }))
export const mockWebSearchHandler = mock<
  (...args: unknown[]) => Promise<unknown>
>(async () => ({ results: ["mock search result"] }))
export const mockMcpRunCommandHandler = mock<
  (...args: unknown[]) => Promise<unknown>
>(async () => ({ output: "mcp command output" }))
export const mockMcpShowSecurityRulesHandler = mock<
  (...args: unknown[]) => Promise<unknown>
>(async () => ({ rules: "mock rules" }))

// Add handlers for missing Coder tools
export const mockCreateOrUpdateFilesHandler = mock<
  (...args: unknown[]) => Promise<unknown>
>(async () => ({ success: true }))
export const mockEditFileHandler = mock<
  (...args: unknown[]) => Promise<unknown>
>(async () => ({ success: true }))
export const mockCodebaseSearchHandler = mock<
  (...args: unknown[]) => Promise<unknown>
>(async () => ({ results: ["mock code snippet"] }))
export const mockGrepSearchHandler = mock<
  (...args: unknown[]) => Promise<unknown>
>(async () => ({ results: ["mock grep line"] }))

function createMockTool(
  name: string,
  description: string,
  handler: (...args: unknown[]) => Promise<unknown>
): AnyTool<any> {
  return {
    name,
    description,
    handler: mock(handler),
  } as AnyTool<any>
}

export const mockTools: AnyTool<any>[] = [
  createMockTool("readFile", "Reads files", mockReadFileHandler),
  createMockTool("writeFile", "Writes files", mockWriteFileHandler),
  createMockTool("runTerminalCommand", "Runs command", mockRunCommandHandler),
  createMockTool(
    "updateTaskState",
    "Updates state",
    mockUpdateTaskStateHandler
  ),
  createMockTool("web_search", "Searches web", mockWebSearchHandler),
  createMockTool(
    "mcp_cli-mcp-server_run_command",
    "MCP run cmd",
    mockMcpRunCommandHandler
  ),
  createMockTool(
    "mcp_cli-mcp-server_show_security_rules",
    "MCP show rules",
    mockMcpShowSecurityRulesHandler
  ),
  // Add missing Coder tools to the array
  createMockTool(
    "createOrUpdateFiles",
    "Creates/updates files",
    mockCreateOrUpdateFilesHandler
  ),
  createMockTool("edit_file", "Edits a file", mockEditFileHandler),
  createMockTool(
    "codebase_search",
    "Searches codebase",
    mockCodebaseSearchHandler
  ),
  createMockTool("grep_search", "Performs grep search", mockGrepSearchHandler),
]

export function getMockTools(names: string[]): AnyTool<any>[] {
  return mockTools.filter(tool => names.includes(tool.name))
}

export function findToolMock(name: string): AnyTool<any> | undefined {
  return mockTools.find(tool => tool.name === name)
}

// Helper to create a basic mock agent
export function createMockAgent(name: string, description: string) {
  return {
    name,
    description,
    tools: new Map(), // Mock tools map
    model: mockDeepseekModelAdapter, // Use the mock model adapter
    // Add a mock send method
    send: mock(async (_message: unknown) => {
      // console.log(`Mock agent ${name} received message:`, message)
      return { success: true }
    }),
  }
}

export function setupTestEnvironmentFocused(): void {
  // Clear specific mocks
  mockInfo.mockClear()
  mockError.mockClear()
  mockWarn.mockClear()
  mockDebug.mockClear()
  mockEmit.mockClear()
  mockKvGet.mockClear()
  mockKvSet.mockClear() // Clear set calls
  mockKvDelete.mockClear()
  mockKvHas.mockClear()
  mockKvAll.mockClear()
  mockSandboxFilesRead.mockClear()
  mockSandboxFilesWrite.mockClear()
  mockSandboxFilesList.mockClear()
  mockSandboxFilesRemove.mockClear()
  mockSandboxProcessStart.mockClear()
  mockSandboxProcessStartAndWait.mockClear()
  mockModelRequest.mockClear()
  mockUpdateTaskStateHandler.mockClear()
  mockReadFileHandler.mockClear()
  mockWriteFileHandler.mockClear()
  mockRunCommandHandler.mockClear()
  mockWebSearchHandler.mockClear()
  mockMcpRunCommandHandler.mockClear()
  mockMcpShowSecurityRulesHandler.mockClear()
  // Add new handlers to clear
  mockCreateOrUpdateFilesHandler.mockClear()
  mockEditFileHandler.mockClear()
  mockCodebaseSearchHandler.mockClear()
  mockGrepSearchHandler.mockClear()

  // Reset handlers on mock tools
  mockTools.forEach(tool => {
    if (tool.handler && (tool.handler as any).mockClear) {
      ;(tool.handler as any).mockClear()
    }
  })

  // Clear KV store data
  Object.keys(mockKvStoreData).forEach(key => delete mockKvStoreData[key])
}

// --- Global Hooks ---
// Automatically run setup before each test
beforeEach(() => {
  setupTestEnvironmentFocused()
})
