import { vi } from "vitest"
import { EventEmitter } from "events"
import type { Tool } from "@inngest/agent-kit"
import type { AgentDependencies, HandlerLogger } from "@/types/agents" // Assuming types are correct
import { Agent } from "@inngest/agent-kit"
import { /* NetworkStatus, */ type TddNetworkState } from "@/types/network" // Import necessary types
import { deepseek } from "@inngest/ai/models" // Import real deepseek
import { z } from "zod"

// --- Basic Mocks ---

/** Mock implementation for the HandlerLogger interface. */
export const mockLogger: HandlerLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
  log: vi.fn(),
}

/** Mock EventEmitter for system events. */
export const mockSystemEvents = new EventEmitter()

/** Mock API key for testing purposes. */
export const mockApiKey = "mock-api-key"
/** Mock model name for testing purposes. */
export const mockModelName = "mock-model"
/** Mock event ID for testing purposes. */
export const mockEventId = "mock-event-id-focused"

// --- Use REAL Deepseek Model Adapter --- //
const realDeepseekApiKey = process.env.DEEPSEEK_API_KEY || "dummy-key-for-test"
const realDeepseekModelName = process.env.DEEPSEEK_MODEL || "deepseek-coder"
export const realDeepseekModelAdapter = deepseek({
  apiKey: realDeepseekApiKey,
  model: realDeepseekModelName,
})

// --- Mocked Deepseek model adapter (KEEP FOR REFERENCE) --- //
export const mockDeepseekModel: any = {
  adapterId: "mock-deepseek-adapter",
  modelId: mockModelName,
  request: vi.fn().mockResolvedValue({
    toolCalls: [],
    finishReason: "stop",
    usage: { promptTokens: 10, completionTokens: 10 },
    raw: { response: { choices: [{ message: { content: "Mock response" } }] } },
  }),
} as const // Use 'as const' for better type inference if possible

// --- Mock Tools Factory (Basic) ---

/** Simple array of mock tools for basic filtering tests. */
export const mockTools: Tool<any>[] = [
  {
    name: "updateTaskState",
    description: "Updates network state",
    parameters: {},
    handler: vi.fn(),
  },
  {
    name: "web_search",
    description: "Performs web search",
    parameters: z.object({ query: z.string() }),
    handler: vi.fn(),
  },
  {
    name: "readFile",
    description: "Reads a file",
    parameters: {},
    handler: vi.fn(),
  },
  {
    name: "runTerminalCommand",
    description: "Runs command",
    parameters: {},
    handler: vi.fn(),
  },
  {
    name: "createOrUpdateFiles",
    description: "Writes files",
    parameters: {},
    handler: vi.fn(),
  },
  {
    name: "edit_file",
    description: "Edits a file",
    parameters: {},
    handler: vi.fn(),
  },
  {
    name: "codebase_search",
    description: "Searches codebase",
    parameters: {},
    handler: vi.fn(),
  },
  {
    name: "grep_search",
    description: "Performs grep search",
    parameters: {},
    handler: vi.fn(),
  },
  // Add more mock tools as needed for other agents later
]

// --- Tool Mock Helpers ---

/**
 * Finds a specific mock tool from the mockTools array by name.
 * Allows accessing the mock handler for assertions.
 * @param name The name of the tool to find.
 * @returns The mock tool object or undefined if not found.
 * @throws Error if the tool is not found.
 */
export function findToolMock(name: string): Tool<any> {
  const tool = mockTools.find(t => t.name === name)
  if (!tool) {
    throw new Error(
      `Mock tool with name "${name}" not found in mockTools array.`
    )
  }
  return tool
}

/**
 * Retrieves a subset of mock tools based on the provided names.
 * @param names An array of tool names to retrieve.
 * @returns An array of mock tool objects matching the provided names.
 * @throws Error if any requested tool name is not found in mockTools.
 */
export function getMockTools(names: string[]): Tool<any>[] {
  return names.map(name => {
    const tool = mockTools.find(t => t.name === name)
    if (!tool) {
      throw new Error(
        `Mock tool with name "${name}" not found in mockTools array.`
      )
    }
    return tool
  })
}

// --- Setup Function ---

/**
 * Resets all Vitest mocks before each test.
 * Should be called in a `beforeEach` block in test files.
 */
export function setupTestEnvironmentFocused() {
  vi.resetAllMocks()
  // Re-apply mock return value for deepseek if needed after reset
  // (The vi.mock above should handle this, but keep if issues arise)
  // vi.mocked(deepseek).mockReturnValue({ client: { api: 'deepseek' } } as any);
}

// --- Basic Dependencies Factory ---

/**
 * Creates a basic set of mock dependencies USING THE REAL MODEL ADAPTER.
 * Useful for testing functions that don't require full agent/tool setup.
 * Includes mock logger, systemEvents, apiKey, modelName, eventId, null sandbox,
 * and the REAL deepseek model adapter.
 * @returns A partial AgentDependencies object suitable for basic agent creation tests.
 */
export const createBaseMockDependencies = (): Omit<
  AgentDependencies,
  "allTools" | "agents"
> => ({
  log: mockLogger,
  systemEvents: mockSystemEvents,
  apiKey: mockApiKey,
  modelName: mockModelName,
  model: realDeepseekModelAdapter, // <-- Use the REAL model adapter
  sandbox: null,
  eventId: "mock-event-id-base",
})

// --- Agent Factory ---

/**
 * Creates a basic mock agent object conforming to the Agent interface.
 * Useful for testing agent creation functions or network interactions
 * where the agent's internal logic is not the focus.
 *
 * @param id - The ID for the mock agent (e.g., "agent-coder").
 * @param name - The name for the mock agent (e.g., "Coder Agent").
 * @param description - Optional description for the mock agent.
 * @returns A mock Agent object with mocked run/ask methods.
 */
export function createMockAgent(
  id: string,
  name: string,
  description?: string
): Agent<any> {
  // Return a plain object that satisfies the basic structure Agent functions expect.
  // We can add mock implementations for run/ask later if needed.
  return {
    id,
    name,
    description: description || `Mock description for ${name}`,
    // Mimic opts structure needed by some tests/logic
    opts: {
      // Add minimal opts properties if agent creation functions rely on them
      model: { client: { api: "mock-model" } } as any, // Mock model access
      tools: [], // Start with empty tools, add if needed
      logger: mockLogger, // Use the shared mock logger
      system: "Mock system prompt", // Default prompt
    },
    // Mock methods (can be spied on using vi.spyOn)
    run: vi
      .fn()
      .mockResolvedValue({ output: [`Mock run response from ${name}`] }) as any,
    ask: vi
      .fn()
      .mockResolvedValue({ output: [`Mock ask response from ${name}`] }) as any,
    // Add other methods like .withTools(), .withModel() if needed, returning `this` or a new mock
  } as unknown as Agent<any> // Use casting carefully
}

// --- Specific Mock Agents ---

export const mockTeamLeadAgent = createMockAgent(
  "agent-teamlead",
  "TeamLead Agent",
  "Анализирует задачу, декомпозирует ее и формулирует требования для TDD." // Use the actual description
)

// Add other mock agents here later as needed
// export const mockCriticAgent = createMockAgent("agent-critic", "Critic Agent", "...");
// export const mockCoderAgent = createMockAgent("agent-coder", "Coder Agent", "...");
// ...etc

// --- Re-exports for Convenience ---

// Re-export common vitest functions
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

// Re-export common types (adjust as needed)
export { type AgentDependencies, type HandlerLogger }
export { type Tool }
export { EventEmitter } // If needed by tests

// --- Network State Factory ---

/** Default initial state for network tests. */
const defaultInitialState: TddNetworkState = {
  status: "IDLE", // Use the string literal value from the Zod enum
  task: "Default test task",
  sandboxId: "mock-sandbox-id", // Default sandbox ID
  // Keep only fields defined in tddNetworkStateSchema
  test_requirements: undefined,
  command_to_execute: undefined,
  test_code: undefined,
  implementation_code: undefined,
  requirements_critique: undefined,
  test_critique: undefined,
  implementation_critique: undefined,
  last_command_output: undefined,
  first_failing_test: undefined,
}

/**
 * Creates a mock initial state for TDD network tests.
 * Merges provided initial data with defaults.
 * @param initialData - Optional partial state to override defaults.
 * @returns A complete TddNetworkState object.
 */
export function createMockNetworkState(
  initialData?: Partial<TddNetworkState>
): TddNetworkState {
  return {
    ...defaultInitialState,
    ...initialData,
  }
}
