// src/__tests__/setup/testSetup.ts --- FINAL TRY ---
import { mock, type Mock } from "bun:test"
import { Tool, type Agent } from "@inngest/agent-kit"
import { deepseek } from "@inngest/ai/models"
// Import types directly from their source file
import {
  type AgentDependencies as AgentDependenciesType, // Import with alias
  type BaseLogger as BaseLoggerType, // Import with alias
  type KvStore as KvStoreType, // Import with alias
  type SystemEvents as SystemEventsType, // Import with alias
} from "../../types/agents"
// Import necessary types from the correct path
import type {} from // ... existing code ...
// ... existing code ...
"../../types/agents"

// Re-export types individually
export type AgentDependencies = AgentDependenciesType
export type BaseLogger = BaseLoggerType
export type KvStore = KvStoreType
export type SystemEvents = SystemEventsType

// --- Constants ---
export const mockApiKey = "mock-api-key"
export const mockModelName = "mock-model"
export const mockEventId = "mock-event-id"
export const mockSandboxId = "mock-sandbox-id"

// --- Mock Implementations ---

export const mockLoggerInstance: BaseLogger = {
  // Use exported type BaseLogger
  info: mock((..._args: unknown[]) => {}),
  error: mock((...args: unknown[]) => console.error("ERROR:", ...args)),
  warn: mock((...args: unknown[]) => console.warn("WARN:", ...args)),
  debug: mock((..._args: unknown[]) => {}),
  fatal: mock((...args: unknown[]) => {
    throw new Error(`FATAL: ${args}`)
  }),
  trace: mock((..._args: unknown[]) => {}),
  silent: mock((..._args: unknown[]) => {}),
  level: "info",
  child: mock(function (
    this: BaseLogger, // Use exported type BaseLogger
    _bindings: Record<string, unknown>
  ): BaseLogger {
    // Use exported type BaseLogger
    return this
  }),
} satisfies BaseLogger

export const mockInfo = mockLoggerInstance.info as Mock<
  (...args: unknown[]) => void
>
export const mockError = mockLoggerInstance.error as Mock<
  (...args: unknown[]) => void
>
export const mockWarn = mockLoggerInstance.warn as Mock<
  (...args: unknown[]) => void
>
export const mockDebug = mockLoggerInstance.debug as Mock<
  (...args: unknown[]) => void
>
export const mockFatal = mockLoggerInstance.fatal as Mock<
  (...args: unknown[]) => void
>
export const mockTrace = mockLoggerInstance.trace as Mock<
  (...args: unknown[]) => void
>
export const mockSilent = mockLoggerInstance.silent as Mock<
  (...args: unknown[]) => void
>
export const mockChild = mockLoggerInstance.child as Mock<
  (bindings: Record<string, unknown>) => BaseLogger // Use exported type BaseLogger
>

export const mockSystemEvents: SystemEvents = {
  // Use exported type SystemEvents
  emit: mock(async (_event: string, _payload: Record<string, unknown>) => {}),
}

// Uncomment and define mockSandbox
// Ensure Sandbox type is imported correctly
export const mockSandbox = {
  // Mock essential Sandbox methods used by agents/tools
  // Add minimal mocks for required properties/methods
  // We can refine these later as needed by specific tests
  filesystem: {
    write: mock(async (_path: string, _content: string) => {}),
    read: mock(async (_path: string) => "mock file content"),
    list: mock(async (_path: string) => []),
    remove: mock(async (_path: string) => {}),
    watchDir: mock((_path: string) => ({
      /* mock watcher */ stop: mock(() => {}),
    })),
  },
  process: {
    start: mock(async (_cmd: string, _opts?: any) => ({
      exitCode: 0,
      stdout: "",
      stderr: "",
      finished: Promise.resolve({ exitCode: 0, stdout: "", stderr: "" }),
    })),
    // Add other common process methods if needed
    // startAndWait: mock(async ...),
    // kill: mock(async ...),
  },
  terminal: {
    start: mock(async (_opts: any) => ({
      /* mock terminal */ kill: mock(() => {}),
      onData: { subscribe: mock(() => {}) },
    })),
  },
  // Add basic mocks for top-level properties often checked
  files: {}, // Placeholder
  commands: {}, // Placeholder
  pty: {}, // Placeholder
  // Add other methods as needed, e.g.:
  close: mock(async () => {}),
  // Add potentially required internal properties/methods if errors persist
  // _Stopped: mock(async () => {}),
  // Define as Mock<Sandbox> directly for better type safety
} as any // Temporarily use 'as any' to bypass strict type checking on the mock object itself

export const mockDeepseekModelAdapter: any = {
  ...(deepseek({
    apiKey: mockApiKey,
    model: mockModelName,
  }) as any),
}

// Uncomment Mock KvStore
const mockKvStoreDataInternal: Record<string, unknown> = {}
export const createMockKvStore = (): KvStore => ({
  // Use exported type KvStore
  get: mock(async <T = unknown>(key: string): Promise<T | undefined> => {
    return mockKvStoreDataInternal[key] as T | undefined
  }) as <T = unknown>(key: string) => Promise<T | undefined>,
  set: mock(async <T = unknown>(key: string, value: T): Promise<void> => {
    mockKvStoreDataInternal[key] = value
  }),
  delete: mock(async (key: string): Promise<boolean> => {
    const exists = key in mockKvStoreDataInternal
    delete mockKvStoreDataInternal[key]
    return exists
  }),
  has: mock(async (key: string): Promise<boolean> => {
    return key in mockKvStoreDataInternal
  }),
  all: mock(async (): Promise<Record<string, unknown>> => {
    return { ...mockKvStoreDataInternal }
  }),
})
export const mockKv = createMockKvStore()

// Uncomment createMockTool
export const createMockTool = <TOutput = unknown>(
  name: string,
  output: TOutput
): Tool.Any => ({
  name,
  description: `Mock tool ${name}`,
  handler: mock(async (): Promise<TOutput> => output) as Mock<
    (...args: unknown[]) => Promise<TOutput>
  >,
})

// Uncomment all tool mocks
// Ensure all tool mocks are exported
export const mockUpdateTaskStateTool = createMockTool("updateTaskState", {
  success: true,
})
export const mockAskHumanForInputTool = createMockTool("askHumanForInput", {
  input: "User input",
})
export const mockWebSearchTool = createMockTool("web_search", {
  results: ["Result 1"],
})
export const mockMcpRunCommandTool = createMockTool(
  "mcp_cli-mcp-server_run_command",
  { output: "mcp command output" }
)
export const mockMcpShowSecurityRulesTool = createMockTool(
  "mcp_cli-mcp-server_show_security_rules",
  { rules: "Mock Security Rules" }
)
export const mockReadFileTool = createMockTool<{ content: string }>(
  "readFile",
  { content: "Mock file content" }
)
export const mockWriteFileTool = createMockTool<{ success: boolean }>(
  "writeFile",
  { success: true }
)
export const mockRunTerminalCommandTool = createMockTool<{ output: string }>(
  "runTerminalCommand",
  { output: "Mock terminal output" }
)
export const mockCreateOrUpdateFilesTool = createMockTool(
  "createOrUpdateFiles",
  { success: true }
)
export const mockEditFileTool = createMockTool("edit_file", { success: true })
export const mockCodebaseSearchTool = createMockTool("codebase_search", {
  results: ["Search Result"],
})
export const mockGrepSearchTool = createMockTool("grep_search", {
  results: ["Grep Result"],
})

// Uncomment mockTools array
export const mockTools: Tool.Any[] = [
  mockUpdateTaskStateTool,
  mockAskHumanForInputTool,
  mockWebSearchTool,
  mockMcpRunCommandTool,
  mockMcpShowSecurityRulesTool,
  mockReadFileTool,
  mockWriteFileTool,
  mockRunTerminalCommandTool,
  mockCreateOrUpdateFilesTool,
  mockEditFileTool,
  mockCodebaseSearchTool,
  mockGrepSearchTool,
]

// Use exported type AgentDependencies
export function createBaseMockDependencies(
  eventIdInput = mockEventId
): Omit<
  AgentDependencies,
  | "allTools"
  | "agents"
  | "kv"
  | "model"
  | "apiKey"
  | "modelName"
  | "systemEvents"
  | "sandbox"
  | "modelApiKey"
> {
  return {
    eventId: eventIdInput,
    log: mockLoggerInstance,
  }
}

// Use exported type AgentDependencies
export function createFullMockDependencies(
  overrides: Partial<AgentDependencies> = {}
): AgentDependencies {
  const base: AgentDependencies = {
    modelApiKey: mockApiKey,
    eventId: mockEventId,
    log: mockLoggerInstance,
    allTools: [...mockTools],
    agents: {} as Record<string, Agent<any>>,
    kv: createMockKvStore(), // Use the function here
    model: mockDeepseekModelAdapter,
    apiKey: mockApiKey,
    modelName: mockModelName,
    systemEvents: mockSystemEvents,
    sandbox: mockSandbox as any, // Use 'as any' for now
  }

  return {
    ...base,
    ...overrides,
  }
}

export function setupTestEnvironment() {
  mock.restore()
  Object.keys(mockKvStoreDataInternal).forEach(
    key => delete mockKvStoreDataInternal[key]
  )
  mockInfo.mockClear()
  mockError.mockClear()
  mockWarn.mockClear()
  mockDebug.mockClear()
  mockFatal.mockClear()
  mockTrace.mockClear()
  mockSilent.mockClear()
  mockChild.mockClear()
  // REMOVED: mockSystemEvents.emit.mockClear()
  ;(
    mockKv.get as Mock<(key: string) => Promise<unknown | undefined>>
  ).mockClear?.()
  ;(
    mockKv.set as Mock<(key: string, value: unknown) => Promise<void>>
  ).mockClear?.()
  ;(mockKv.delete as Mock<(key: string) => Promise<boolean>>).mockClear?.()
  ;(mockKv.has as Mock<(key: string) => Promise<boolean>>).mockClear?.()
  ;(mockKv.all as Mock<() => Promise<Record<string, unknown>>>).mockClear?.()

  mockTools.forEach(tool => {
    if (
      tool.handler &&
      typeof (tool.handler as Mock<(...args: unknown[]) => unknown>)
        .mockClear === "function"
    ) {
      ;(tool.handler as Mock<(...args: unknown[]) => unknown>).mockClear()
    }
  })
}

export const findToolMock = (
  name: string,
  tools: Tool.Any[] = mockTools
): Tool.Any | undefined => {
  return tools.find(t => t.name === name)
}

export const getMockTools = (
  names: string[],
  allAvailableMockTools: Tool.Any[] = mockTools
): Tool.Any[] => {
  return names.map(name => {
    const tool = findToolMock(name, allAvailableMockTools)
    if (!tool)
      throw new Error(`Mock tool "${name}" not found in available mocks`)
    return tool
  })
}

// Uncomment createMockAgent - Use the actual implementation with 'as any'
export const createMockAgent = (name: string, description: string): any =>
  ({
    name,
    description,
    // Add mock methods as needed, e.g.:
    ask: mock(async () => ({ final_output: "mock agent output" })),
    run: mock(async () => ({ final_output: "mock agent output" })),
    // Add a basic definition structure if AgentKit requires it internally
    definition: {
      name,
      description,
      tools: {},
      model: {} as any,
    },
  }) as any // Use 'as any' for the overall return type for now

// REMOVED: Conflicting 'export { mockLoggerInstance }'
