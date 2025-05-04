// src/__tests__/setup/testSetup.ts --- FINAL SIMPLIFIED ---
import { mock, type Mock } from "bun:test"
import { Tool, type Agent } from "@inngest/agent-kit"
import { deepseek } from "@inngest/ai/models"
// DO NOT RE-EXPORT TYPES HERE - Import them directly in test files
import {
  type AgentDependencies,
  type BaseLogger,
  type KvStore,
  type SystemEvents,
} from "../../types/agents"

// --- Constants ---
export const mockApiKey = "mock-api-key"
export const mockModelName = "mock-model"
export const mockEventId = "mock-event-id"
export const mockSandboxId = "mock-sandbox-id"

// --- Mock Implementations ---

export const mockLoggerInstance: BaseLogger = {
  info: mock((..._args: unknown[]) => {}),
  error: mock((...args: unknown[]) => console.error("ERROR:", ...args)),
  warn: mock((...args: unknown[]) => console.warn("WARN:", ...args)),
  debug: mock((..._args: unknown[]) => {}),
  fatal: mock((...args: unknown[]) => console.error("FATAL:", ...args)),
  trace: mock((..._args: unknown[]) => {}),
  silent: mock((..._args: unknown[]) => {}),
  level: "info",
  child: mock(function (
    this: BaseLogger,
    _bindings: Record<string, unknown>
  ): BaseLogger {
    return this
  }),
}

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
  (bindings: Record<string, unknown>) => BaseLogger
>

export const mockSystemEvents: SystemEvents = {
  emit: mock(async (_event: string, _payload: Record<string, unknown>) => {}),
}

// Commented out Sandbox mock
/*
export const mockSandbox = { ... } as any
*/
export const mockSandbox: any = undefined // Placeholder

export const mockDeepseekModelAdapter: any = {
  ...(deepseek({
    apiKey: mockApiKey,
    model: mockModelName,
  }) as any),
}

const mockKvStoreDataInternal: Record<string, unknown> = {}
export const createMockKvStore = (): KvStore => ({
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

// Ensure this is exported
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

export function createFullMockDependencies(
  overrides: Partial<AgentDependencies> = {}
): AgentDependencies {
  const base: AgentDependencies = {
    modelApiKey: mockApiKey,
    eventId: mockEventId,
    log: mockLoggerInstance,
    allTools: [...mockTools],
    agents: {} as Record<string, Agent<any>>,
    kv: createMockKvStore(),
    model: mockDeepseekModelAdapter,
    apiKey: mockApiKey,
    modelName: mockModelName,
    systemEvents: mockSystemEvents,
    sandbox: mockSandbox,
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

// Commented out createMockAgent
/*
export const createMockAgent = (name: string, description: string): any => ({ ... })
*/
export const createMockAgent: any = undefined // Placeholder

// REMOVED: Conflicting 'export { mockLoggerInstance }'
