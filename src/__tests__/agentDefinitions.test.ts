import { describe, beforeEach, it, expect, mock } from "bun:test"

// Import agent creation functions
import { createOpenCodexAgent } from "@/agents/open-codex/logic/createOpenCodexAgent"
import { setupTestEnvironment, mockLogger } from "./testSetup" // Import mockLogger

// Setup test environment before each test
setupTestEnvironment()

// --- Tests for Open Codex Agent ---
describe("createOpenCodexAgent", () => {
  beforeEach(() => {
    setupTestEnvironment() // Reset mocks
  })

  it("should route question to existing agent", async () => {
    const mockAgent = {
      ask: mock().mockResolvedValue("test response"), // Correct usage of mock
    }
    const agents = {
      testAgent: mockAgent,
    }
    const openCodex = createOpenCodexAgent(agents)

    const response = await openCodex.ask("testAgent: test question")

    expect(mockAgent.ask).toHaveBeenCalledWith("test question")
    expect(response).toBe("test response")
  })

  it("should handle unknown agent", async () => {
    const agents = {}
    const openCodex = createOpenCodexAgent(agents, { log: mockLogger })

    const response = await openCodex.ask("unknown: test")

    expect(mockLogger.error).toHaveBeenCalledWith("Unknown agent: unknown")
    expect(response).toContain("Я Open Codex") // Check for default response part
  })

  it("should broadcast response to other agents", async () => {
    const mockAgent1 = {
      ask: mock().mockResolvedValue("response"), // Correct usage of mock
    }
    const mockAgent2 = {
      ask: mock(), // Correct usage of mock
    }
    const agents = {
      agent1: mockAgent1,
      agent2: mockAgent2,
    }
    const openCodex = createOpenCodexAgent(agents)

    await openCodex.ask("agent1: question")

    // Ensure broadcast happens *after* the initial ask resolves
    // Since broadcasting is async and not awaited in the original code,
    // we might need a small delay or a more sophisticated way to check this
    // For now, let's just check if it was called.
    expect(mockAgent2.ask).toHaveBeenCalledWith("response")
  })
})
