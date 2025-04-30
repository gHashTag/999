import { type Sandbox } from "e2b"
import { systemEvents as importedSystemEvents } from "../../utils/logic/systemEvents" // Alias import
// Import unified HandlerLogger and AgentDependencies
import { AgentDependencies, HandlerLogger } from "../../types/agents" // Adjusted path
import { mock } from "bun:test" // ADD import for mock
// import { EventEmitter } from "events" // Unused
import type { Tool } from "@inngest/agent-kit" // Import Tool type
import { mockDeepseekModel } from "../../utils/logic/mockDeepseekModel" // Import mock model

// Mock dependencies for PoC
// FIX: Add handler field to mock tools to match AnyTool type
const mockTools: Tool<any>[] = [
  {
    name: "askHumanForInput",
    description: "Mock tool",
    parameters: {}, // Add empty parameters if needed by Tool type
    // run: async () => ({ output: ["mock response"] }), // Keep run if used elsewhere?
    handler: mock().mockResolvedValue({ output: ["mock response"] }), // ADD handler
  },
  {
    name: "readFile",
    handler: mock().mockResolvedValue("Mock file content"),
  },
]

// Use the imported HandlerLogger type
const mockLogger: HandlerLogger = {
  info: console.log,
  error: console.error,
  warn: console.warn,
  debug: console.debug,
  log: console.log,
}

// Consider providing a more complete mock if needed by agents
// const mockSandbox: Sandbox | null = null // Removed, sandbox comes from args

/**
 * Creates mock dependencies for the CLI PoC.
 * @returns An object containing mock AgentDependencies.
 */
export const createMockDependencies = (
  sandbox: Sandbox | null,
  eventId: string
): AgentDependencies => {
  const baseDeps: AgentDependencies = {
    systemEvents: importedSystemEvents, // Use aliased import
    allTools: mockTools,
    log: mockLogger,
    apiKey: process.env.DEEPSEEK_API_KEY || "mock-api-key",
    modelName: "deepseek-coder",
    model: mockDeepseekModel,
    eventId: eventId,
    sandbox: sandbox,
  }
  if (!sandbox?.process?.startAndWait) {
    sandbox.process.startAndWait = async (/* command, opts */) => {
      return { stdout: "mock stdout", stderr: "mock stderr", exitCode: 0 }
    }
  }
  return baseDeps
}
