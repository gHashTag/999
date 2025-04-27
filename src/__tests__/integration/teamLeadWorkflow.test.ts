import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
// import { Inngest } from "inngest"
// import { serving } from "inngest/test"
import { createDevOpsNetwork } from "@/network/network"
import {
  createTeamLeadAgent,
  createTesterAgent,
  createCodingAgent,
  createCriticAgent,
  createToolingAgent,
} from "@/agents"
import {
  // NetworkStatus, // Removed unused import
  type TddNetworkState,
} from "@/types/network"
import {
  type AgentDependencies,
  type AnyTool,
  // Removed unused imports
} from "@/types/agents"
import { systemEvents } from "@/utils/logic/systemEvents"
import { HandlerLogger } from "@/types/agents"
import type { Message, AgentResult, NetworkRun } from "@inngest/agent-kit" // Import NetworkRun & AgentResult
import { NetworkStatus } from "@/types/network"

// Mock logger
const mockLog = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
  log: vi.fn(),
} as HandlerLogger

// Mock tools (empty for this test)
const mockTools: AnyTool[] = []

// Mock dependencies
const mockAgentDeps: AgentDependencies = {
  allTools: mockTools,
  log: mockLog, // Now properly satisfies AgentDependencies
  apiKey: "test-key",
  modelName: "test-model",
  systemEvents: systemEvents,
  sandbox: null,
}

// Mock Available Agents
// Removed unused mockAvailableAgents array

// Create agent instances using mocks
const teamLead = createTeamLeadAgent(mockAgentDeps)
const tester = createTesterAgent(mockAgentDeps)
const coder = createCodingAgent(mockAgentDeps)
const critic = createCriticAgent(mockAgentDeps)
const tooling = createToolingAgent(mockAgentDeps)

describe("TeamLead Workflow Integration", () => {
  beforeEach(() => {
    // Reset mocks before each test if needed
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Clean up after each test if needed
  })

  it("should progress from IDLE to NEEDS_REQUIREMENTS_CRITIQUE with TeamLead", async () => {
    // Initial state
    const initialState: TddNetworkState = {
      task: "Create a simple add function.",
      status: "IDLE",
      sandboxId: "mock-sandbox-integration",
    }

    // Mock the TeamLead agent's run method to return AgentResult structure
    const mockAgentResult: Partial<AgentResult> = {
      agentName: "Team Lead Agent",
      output: [
        {
          type: "text",
          role: "assistant",
          content: "* Requirement 1: Add two numbers.",
        },
      ] as Message[],
      toolCalls: [],
      createdAt: new Date(),
    }
    // FIX: Return a structure matching AgentResult
    vi.spyOn(teamLead, "run").mockResolvedValue(mockAgentResult as AgentResult)

    // Create the network with mocked agents
    const network = createDevOpsNetwork(
      teamLead,
      tester,
      coder,
      critic,
      tooling
    )

    // Run the network
    const result: NetworkRun<TddNetworkState> = await network.run(
      initialState.task,
      {
        state: initialState,
      }
    )

    // Assertions
    expect(result).toBeDefined()
    expect(result.state).toBeDefined()
    const finalState = result.state.kv.get("network_state") as TddNetworkState

    expect(finalState).toBeDefined()
    expect(finalState.status).toBe("NEEDS_REQUIREMENTS_CRITIQUE")
    expect(finalState.test_requirements).toContain("Requirement 1")
    // Verify the mock was called
    expect(teamLead.run).toHaveBeenCalled()
  })

  it("should handle agent failure gracefully", async () => {
    // Initial state
    const initialState: TddNetworkState = {
      task: "Create a failing task.",
      status: "IDLE",
      sandboxId: "mock-sandbox-fail",
    }

    vi.spyOn(teamLead, "run").mockRejectedValue(new Error("Agent failed!"))

    // Create the network with mocked agents
    const failingDeps = { ...mockAgentDeps } // Create separate deps if needed
    const teamLeadAgent = createTeamLeadAgent(failingDeps)
    const network = createDevOpsNetwork(
      teamLeadAgent,
      tester,
      coder,
      critic,
      tooling
    )

    // Run the network
    const result: NetworkRun<TddNetworkState> = await network.run(
      initialState.task,
      {
        state: initialState,
      }
    )

    // Assertions for failure
    expect(result).toBeDefined()
    // FIX: Remove checks for result.error as it doesn't exist on NetworkRun
    // expect(result.error).toBeDefined()
    // expect(result.error?.message).toContain("Agent failed!")

    // Check final state in KV store (should likely be FAILED)
    const finalState = result.state?.kv.get("network_state") as TddNetworkState
    expect(finalState).toBeDefined()
    // Expect the router to set the status to FAILED upon agent error
    expect(finalState.status).toBe(NetworkStatus.Enum.FAILED) // Use Enum
  })
})
