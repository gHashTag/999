import { describe, beforeEach, it, expect, mock } from "bun:test"

// Import agent creation functions
import { createOpenCodexAgent } from "@/agents/open-codex/logic/createOpenCodexAgent"
// import { createTeamLeadAgent } from "@/agents/teamlead/logic/createTeamLeadAgent" // Unused
// import { createCriticAgent } from "@/agents/critic/logic/createCriticAgent" // Unused
// import { createCoderAgent } from "@/agents/coder/logic/createCoderAgent" // Unused
import {
  setupTestEnvironmentFocused,
  mockLogger /*, type AgentDependencies*/,
} from "../setup/testSetupFocused" // Correct path relative to new location

// Setup test environment before each test
// setupTestEnvironmentFocused() // This call outside describe/beforeEach might be problematic, rely on the hook inside setup file

// --- Tests for Open Codex Agent ---
describe("createOpenCodexAgent", () => {
  beforeEach(() => {
    setupTestEnvironmentFocused() // Reset mocks via the setup function (assuming it contains the reset logic)
  })

  it("should route question to existing agent", async () => {
    const mockAgent = {
      ask: mock().mockResolvedValue("test response"),
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
    expect(response).toContain("Я Open Codex")
  })

  it("should broadcast response to other agents", async () => {
    const mockAgent1 = {
      ask: mock().mockResolvedValue("response"),
    }
    const mockAgent2 = {
      ask: mock(),
    }
    const agents = {
      agent1: mockAgent1,
      agent2: mockAgent2,
    }
    const openCodex = createOpenCodexAgent(agents)

    await openCodex.ask("agent1: question")

    // Check if broadcast was called
    expect(mockAgent2.ask).toHaveBeenCalledWith("response")
  })
})

// Add similar describe blocks for other agent creation functions if they exist
// e.g., describe("createTeamLeadAgent", () => { ... });
