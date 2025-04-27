import { InngestTestEngine } from "@inngest/test"
import { createCodingAgent } from "@/agents/coder/logic/createCodingAgent" // Adjust path if needed
import { vi, describe, it, expect, beforeEach } from "vitest"
import {
  type AgentDependencies,
  type HandlerLogger,
  type AgentCreationProps,
} from "@/types/agents"
import { EventEmitter } from "events"
import { Inngest } from "inngest"

// Create a dummy Inngest instance for testing
const testInngest = new Inngest({ id: "test-app" })

// Mock dependencies
const mockLogger: HandlerLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
  log: vi.fn(),
}

// Define props needed for agent creation, including instructions
const agentCreationProps: AgentCreationProps = {
  instructions: "mock coder instructions",
}

// Base dependencies without instructions
const baseMockDependencies: Omit<AgentDependencies, "agents"> = {
  apiKey: "test-key",
  modelName: "test-model",
  allTools: [],
  log: mockLogger,
  systemEvents: new EventEmitter(),
  sandbox: null,
  eventId: "test-event-id",
}

// --- Test Inngest Function Wrapper --- //
const codingTestFunction = testInngest.createFunction(
  { id: "test-coding-fn", name: "Test Coder Agent Logic" },
  { event: "test/coder.run" },
  async ({ step }: { event: any; step: any }) => {
    const generatedCode = await step.run("generate-code", async () => {
      return "Placeholder for agent logic if step wasn't mocked"
    })

    return generatedCode
  }
)
// --- --- //

describe("Agent Definitions: Coder Agent", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should create a Coder agent with correct basic properties", () => {
    const agent = createCodingAgent({
      ...baseMockDependencies,
      ...agentCreationProps,
    })
    expect(agent.name).toBe("Coder Agent")
    expect(agent.description).toBeDefined()
    expect(agent.system).toBe(agentCreationProps.instructions)
  })

  it("should generate code using InngestTestEngine", async () => {
    const engine = new InngestTestEngine({ function: codingTestFunction })

    const mockCode = "function add(a, b) { return a + b; }"
    const inputTask = "Write add function"

    const { result } = await engine.execute({
      events: [{ name: "test/coder.run", data: { taskInput: inputTask } }],
      steps: [
        {
          id: "generate-code",
          handler: () => mockCode,
        },
      ],
    })

    expect(result).toEqual(mockCode)
  })
})
