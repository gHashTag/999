import { createCoderAgent } from "../../agents/coder/logic/createCoderAgent"
import { createCriticAgent } from "../../agents/critic/logic/createCriticAgent"
import { createOpenCodexAgent } from "../../agents/open-codex/logic/createOpenCodexAgent"
import { describe, it, expect, vi } from "vitest"
import type {
  AgentDependencies,
  // AvailableAgent, // Removed unused import
} from "../../types/agents"

// Minimal mock dependencies for this integration test
const mockDeps: AgentDependencies = {
  allTools: [], // Start with no tools, agents might filter or use defaults
  log: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    log: vi.fn(),
  },
  apiKey: "test-key",
  modelName: "test-model",
  systemEvents: { emit: vi.fn() } as any,
  sandbox: null,
}

// Empty available agents for this test
// const mockAvailableAgents: AvailableAgent[] = [] // Remove unused variable

describe("Minimal agent communication", () => {
  it("should perform basic question-answer between agents", async () => {
    // Create agents with mock dependencies
    const coder = createCoderAgent(mockDeps)
    const critic = createCriticAgent(mockDeps)

    // Simple question from critic to coder
    const question = "Can you write a simple sum function?"

    // Simulate running the coder agent
    // Replace direct .ask with .run and mock response structure
    const codeResult = await coder.run(question) // Use run

    // Check the coder's output
    expect(codeResult).toBeDefined()
    expect(codeResult.output).toBeDefined()
    const generatedCode = codeResult.output.join("\n") // Assuming output is string array
    expect(generatedCode).toContain("function") // Basic check

    // Simulate running the critic agent
    const reviewResult = await critic.run(
      `Evaluate this code: ${generatedCode}`
    ) // Use run

    // Check the critic's output
    expect(reviewResult).toBeDefined()
    expect(reviewResult.output).toBeDefined()
    const critique = reviewResult.output.join("\n") // Assuming output is string array
    expect(critique).toBeTruthy() // Basic check, content might vary
    // Example: expect(critique).toContain('review') // More specific check if possible
  })

  describe("Open Codex agent communication", () => {
    it("should route messages between agents", async () => {
      // Create mock agents
      const mockAgent1 = {
        ask: vi.fn().mockResolvedValue("response from agent1"),
      }
      const mockAgent2 = {
        ask: vi.fn().mockResolvedValue("response from agent2"),
      }

      // Create open-codex agent with mock agents
      const openCodex = createOpenCodexAgent({
        agent1: mockAgent1,
        agent2: mockAgent2,
      })

      // Test routing to agent1
      const response1 = await openCodex.ask("agent1: test question")
      expect(response1).toBe("response from agent1")
      expect(mockAgent1.ask).toHaveBeenCalledWith("test question")

      // Test routing to agent2
      const response2 = await openCodex.ask("agent2: another question")
      expect(response2).toBe("response from agent2")
      expect(mockAgent2.ask).toHaveBeenCalledWith("another question")

      // Test unknown agent
      const response3 = await openCodex.ask("unknown: question")
      expect(response3).toContain("Unknown agent")
    })
  })
})
