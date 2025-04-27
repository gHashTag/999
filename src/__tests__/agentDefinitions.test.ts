import { describe, beforeEach, it, expect, vi } from "vitest"

// Import agent creation functions
// import { createTesterAgent } from "@/agents/tester/logic/createTesterAgent"
import { createOpenCodexAgent } from "@/agents/open-codex/logic/createOpenCodexAgent"
// import { createToolingAgent } from "@/agents/tooling/logic/createToolingAgent"; // Placeholder

// Import the setup function
import { setupTestEnvironment } from "./agents/testSetup"

// Import the test runner functions
import { runTesterAgentTests } from "./agents/testerAgentTests"
import { runCodingAgentTests } from "./agents/codingAgentTests"
// import { runTeamLeadAgentTests } from "./agents/teamLeadAgentTests" // Removed import for non-existent file
// import { runToolingAgentTests } from "./agents/toolingAgentTests" // Removed import for non-existent file
// import { runCriticAgentTests } from "./agents/criticAgentTests"

// import type { AgentDependencies } from "@/types/agents" // REMOVED

// Minimal mock dependencies for definition tests -- REMOVED
// const mockAgentDepsMinimal: AgentDependencies = { /* ... */ };

// Minimal mock for available agents (empty array)
// const mockAvailableAgents: AvailableAgent[] = [] // Remove unused variable

describe("Agent Definitions", () => {
  // Setup mocks before each test suite defined below
  beforeEach(() => {
    setupTestEnvironment()
  })

  // --- Run Tests for createTesterAgent ---
  describe("createTesterAgent", () => {
    runTesterAgentTests() // Call the imported function
  })

  // --- Run Tests for createCodingAgent ---
  describe("createCodingAgent", () => {
    // FIX: Pass minimal mock deps directly to creation function if needed
    // Or define mocks inside the test if they differ
    runCodingAgentTests() // Call the imported function
  })

  // --- Run Tests for createTeamLeadAgent ---
  // describe("createTeamLeadAgent", () => {
  //   runTeamLeadAgentTests() // Call the imported function
  // })

  // --- Run Tests for createToolingAgent ---
  // describe("createToolingAgent", () => {
  //   runToolingAgentTests() // Call the imported function
  // })

  // --- Tests for Open Codex Agent ---
  describe("createOpenCodexAgent", () => {
    it("should route question to existing agent", async () => {
      const mockAgent = {
        ask: vi.fn().mockResolvedValue("test response"),
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
      const mockLogger = {
        error: vi.fn(),
      }
      const agents = {}
      const openCodex = createOpenCodexAgent(agents, { log: mockLogger })

      const response = await openCodex.ask("unknown: test")

      expect(mockLogger.error).toHaveBeenCalledWith("Unknown agent: unknown")
      expect(response).toContain("Я Open Codex")
    })

    it("should broadcast response to other agents", async () => {
      const mockAgent1 = {
        ask: vi.fn().mockResolvedValue("response"),
      }
      const mockAgent2 = {
        ask: vi.fn(),
      }
      const agents = {
        agent1: mockAgent1,
        agent2: mockAgent2,
      }
      const openCodex = createOpenCodexAgent(agents)

      await openCodex.ask("agent1: question")

      expect(mockAgent2.ask).toHaveBeenCalledWith("response")
    })
  })
}) // End of outer describe
