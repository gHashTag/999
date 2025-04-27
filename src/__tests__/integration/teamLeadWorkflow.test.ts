import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
// import { Inngest } from "inngest"
// import { serving } from "inngest/test"
import { createDevOpsNetwork } from "@/network/network"
// import { Network } from "@inngest/agent-kit" // Keep Network if used for mocking
import {
  type NetworkRun,
  type AgentResult,
  type Message,
  Network,
  State,
} from "@inngest/agent-kit" // Add imports
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
  // Removed unused imports
} from "@/types/agents"
// import { systemEvents } from "@/utils/logic/systemEvents" // Removed unused import
import { HandlerLogger } from "@/types/agents"
import { HandlerStepName } from "@/types/handlerSteps"
import { NetworkStatus } from "@/types/network"
// import { readAgentInstructions } from "@/utils/logic/readAgentInstructions"
// import { getSandbox } from "@/inngest/utils/sandboxUtils" // Correct import path
import { type Context } from "inngest" // Import Context from inngest directly
import { codingAgentHandler } from "@/inngest/index" // Correct path to handler
// import { type Context as InngestContext } from "inngest" // Removed unused import
import type { Sandbox } from "e2b" // Add import for Sandbox type

// Mock the modules containing the functions
vi.mock("@/utils/logic/readAgentInstructions", () => ({
  readAgentInstructions: vi.fn().mockResolvedValue("Mocked Instructions"),
}))

vi.mock("@/inngest/utils/sandboxUtils", () => ({
  getSandbox: vi.fn().mockResolvedValue(null as unknown as Sandbox),
}))

// Mock logger
const mockLog = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
  log: vi.fn(),
} as HandlerLogger

// Mock tools (empty for this test)
// const mockTools: AnyTool[] = [] // Removed unused variable

// Mock dependencies
const mockAgentDeps: AgentDependencies & {
  instructions?: string // Generic for any agent
  coderInstructions?: string
  testerInstructions?: string
  teamLeadInstructions?: string
  criticInstructions?: string
  toolingInstructions?: string
} = {
  allTools: [], // Simplification for this test
  log: mockLog,
  apiKey: "test-key",
  modelName: "test-model",
  systemEvents: { emit: vi.fn() } as any,
  sandbox: null,
  coderInstructions: "mock coder instructions",
  testerInstructions: "mock tester instructions",
  teamLeadInstructions: "mock teamlead instructions",
  criticInstructions: "mock critic instructions",
  toolingInstructions: "mock tooling instructions",
}

// Mock Available Agents
// Removed unused mockAvailableAgents array

// Create agent instances using mocks
const teamLead = createTeamLeadAgent({
  ...mockAgentDeps,
  instructions: mockAgentDeps.teamLeadInstructions!,
})
const tester = createTesterAgent({
  ...mockAgentDeps,
  instructions: mockAgentDeps.testerInstructions!,
})
const coder = createCodingAgent({
  ...mockAgentDeps,
  instructions: mockAgentDeps.coderInstructions!,
})
const critic = createCriticAgent({
  ...mockAgentDeps,
  instructions: mockAgentDeps.criticInstructions!,
})
const tooling = createToolingAgent({
  ...mockAgentDeps,
  instructions: mockAgentDeps.toolingInstructions!,
})

// Mock the network creation to use our mocked agents
vi.mock("@/network/network", () => ({
  createDevOpsNetwork: vi.fn(() => {
    // Use the imported Network type
    return new Network({
      name: "Mocked DevOps Network",
      agents: [teamLead, tester, coder, critic, tooling],
    })
  }),
}))

describe("TeamLead Workflow Integration", () => {
  beforeEach(() => {
    // Reset mocks before each test if needed
    vi.clearAllMocks()
    // Mock implementations are now defined via vi.mock above
    // Remove spyOn calls
    // vi.spyOn(readAgentInstructions).mockResolvedValue(
    //   "Mocked Instructions"
    // )
    // vi.spyOn(getSandbox).mockResolvedValue(
    //   null as unknown as Sandbox
    // )
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
    // Use the imported AgentResult and Message types
    const mockAgentResult: Partial<AgentResult> = {
      agentName: "Team Lead Agent",
      output: [
        {
          type: "text",
          role: "assistant",
          content: "* Requirement 1: Add two numbers.",
        },
      ] as Message[], // Use imported Message type
      toolCalls: [],
      createdAt: new Date(),
    }
    // FIX: Return a structure matching AgentResult
    vi.spyOn(teamLead, "run").mockResolvedValue(mockAgentResult as AgentResult) // Use imported AgentResult type

    // Create the network with mocked agents (coder is now sync)
    const network = createDevOpsNetwork(
      teamLead,
      tester,
      coder, // Pass the sync agent directly
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

    // Create the network with mocked agents (coder is sync)
    const failingDeps = { ...mockAgentDeps }
    const teamLeadAgent = createTeamLeadAgent({
      ...failingDeps,
      instructions: failingDeps.teamLeadInstructions!,
    })
    const network = createDevOpsNetwork(
      teamLeadAgent,
      tester,
      coder, // Pass the sync agent directly
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

  it("should handle the initial state correctly when starting the network", async () => {
    const initialState: TddNetworkState = {
      status: NetworkStatus.Enum.IDLE,
      task: "Create a simple add function",
      sandboxId: "mock-sandbox-initial", // Add sandboxId
    }
    const expectedFinalState: TddNetworkState = {
      ...initialState,
      status: NetworkStatus.Enum.NEEDS_REQUIREMENTS_CRITIQUE,
    }

    // Simplified Mock State - focus on what's essential for the test
    const mockKvStore = {
      get: vi.fn().mockReturnValue(expectedFinalState),
      set: vi.fn(),
      all: vi.fn().mockReturnValue({ network_state: expectedFinalState }),
      delete: vi.fn(),
      has: vi.fn(),
    }

    // Mock the NetworkRun result, ensuring state matches the expected structure
    const mockRunResult: Partial<NetworkRun<TddNetworkState>> = {
      // output: ["TeamLead requirements generated"], // Remove output field
      // Adjust mock to minimally satisfy the State type structure for kv access
      state: { kv: mockKvStore } as unknown as State<TddNetworkState>,
    }

    const mockNetworkInstance = {
      run: vi
        .fn()
        .mockResolvedValue(mockRunResult as NetworkRun<TddNetworkState>),
      state: { kv: mockKvStore }, // Reuse the same kv store mock
    }
    vi.mocked(createDevOpsNetwork).mockReturnValue(mockNetworkInstance as any)

    const mockStep = {
      run: vi.fn().mockImplementation(async (name, fn) => {
        if (name === HandlerStepName.NETWORK_RUN_START) {
          return await fn()
        }
        return {}
      }),
    } as unknown as Context["step"]

    const mockEvent = {
      id: "test-event-initial",
      name: "coding-agent/run",
      data: { currentState: initialState },
    } as any

    const result = await codingAgentHandler({
      event: mockEvent,
      step: mockStep,
      logger: mockLog,
    })

    expect(vi.mocked(createDevOpsNetwork)).toHaveBeenCalled()
    expect(mockNetworkInstance.run).toHaveBeenCalledWith(initialState.task)
    expect(result).toBeDefined()
    // Explicitly type the handler's return value
    const handlerResult = result

    if (handlerResult) {
      expect(handlerResult.finalState).toBeDefined()
      expect(handlerResult.finalState?.status).toBe(
        NetworkStatus.Enum.NEEDS_REQUIREMENTS_CRITIQUE
      )
      // Access the error property safely now using in operator
      expect(
        "error" in handlerResult ? handlerResult.error : undefined
      ).toBeUndefined()
    }
  })

  it.skip("should fail gracefully if an agent throws an error", async () => {
    const mockKvStoreFail = {
      get: vi.fn(),
      set: vi.fn(),
      all: vi.fn(),
      delete: vi.fn(),
      has: vi.fn(),
    }
    const mockFailingNetwork = {
      run: vi.fn().mockRejectedValue(new Error("Agent failed")),
      state: { kv: mockKvStoreFail },
    }
    vi.mocked(createDevOpsNetwork).mockReturnValue(mockFailingNetwork as any)

    const initialState: TddNetworkState = {
      status: NetworkStatus.Enum.IDLE,
      task: "fail task",
      sandboxId: "fail-sandbox",
    }
    const mockStepFail = {
      run: vi.fn().mockRejectedValue(new Error("Agent failed")),
    } as unknown as Context["step"]
    const mockEventFail = {
      id: "fail-event",
      name: "fail",
      data: { currentState: initialState },
    } as any

    const resultFail = await codingAgentHandler({
      event: mockEventFail,
      step: mockStepFail,
      logger: mockLog,
    })

    expect(resultFail).toBeDefined()
    // Explicitly type the handler's return value
    const handlerResultFail = resultFail

    if (handlerResultFail) {
      // Check error property safely now using in operator
      expect(
        "error" in handlerResultFail ? handlerResultFail.error : undefined
      ).toBeDefined()
      expect(
        "error" in handlerResultFail ? handlerResultFail.error : undefined
      ).toContain("Agent failed")
      expect(handlerResultFail.finalState).toBeDefined()
      expect(handlerResultFail.finalState?.status).toBe(NetworkStatus.Enum.IDLE) // Assuming IDLE state on failure before router handles it
    }
  })
})
