import { type Sandbox } from "e2b"
import { systemEvents } from "../../utils/logic/systemEvents" // Adjusted path
// Import unified HandlerLogger and AgentDependencies
import {
  AgentDependencies,
  HandlerLogger,
  type AnyTool,
} from "../../types/agents" // Adjusted path
import { vi } from "vitest" // ADD import for vi

// Mock dependencies for PoC
// FIX: Add handler field to mock tools to match AnyTool type
const mockTools: AnyTool[] = [
  {
    name: "askHumanForInput",
    description: "Mock tool",
    parameters: {}, // Add empty parameters if needed by Tool type
    // run: async () => ({ output: ["mock response"] }), // Keep run if used elsewhere?
    handler: vi.fn().mockResolvedValue({ output: ["mock response"] }), // ADD handler
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
const mockSandbox: Sandbox | null = null // Simplified to null as per original baseDeps usage

/**
 * Creates mock dependencies for the CLI PoC.
 * @returns An object containing mock AgentDependencies.
 */
export function createMockDependencies(): AgentDependencies {
  const baseDeps: AgentDependencies = {
    systemEvents,
    allTools: mockTools,
    log: mockLogger,
    apiKey: "mock-api-key", // Use placeholder or env var if needed
    modelName: "gpt-4", // Use placeholder or env var if needed
    sandbox: mockSandbox,
    // agents property will be populated later if needed by the calling context
  }
  return baseDeps
}
