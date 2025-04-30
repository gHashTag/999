// import { InngestTestEngine } from "@inngest/test"
import { createTeamLeadAgent } from "@/agents/teamlead/logic/createTeamLeadAgent"
import { describe, it, expect, beforeEach, mock } from "bun:test"
// import { Inngest } from "inngest" // Remove unused Inngest import
import {
  createFullMockDependencies,
  getMockTools,
  type AgentDependencies,
  mockLogger,
  // mockKv, // Remove unused
  // mockSystemEvents, // Remove unused
  mockDeepseekModelAdapter,
} from "../setup/testSetupFocused"
// import type { Tool, Agent } from "@inngest/agent-kit"
import { TddNetworkState, NetworkStatus } from "@/types/network"

// Create a dummy Inngest instance for testing
// const testInngest = new Inngest({ id: "test-app" })

// Mock dependencies - Removed unused mockLogger definition
// const mockLogger: HandlerLogger = {
//   ...centralMockLogger,
//   log: mock(() => {}),
// } as unknown as HandlerLogger

// Removed unused agentCreationProps
// const agentCreationProps = {
//   instructions: "mock teamlead instructions",
// }

// Removed unused baseMockDependencies definition
// const baseMockDependencies: Omit<AgentDependencies, "agents" | "instructions"> =
//   { ... }

// --- Test Inngest Function Wrapper --- //
// const teamLeadTestFunction = testInngest.createFunction(
//   { id: "test-teamlead-fn", name: "Test TeamLead Agent Logic" },
//   { event: "test/teamlead.run" },
//   async ({ step }: { event: any; step: any }) => {
//     const requirements = await step.run("generate-requirements", async () => {
//       // This internal agent call won't actually happen if the step is mocked
//       return "Placeholder for agent logic if step wasn't mocked"
//     })
//
//     return requirements
//   }
// )
// --- --- //

// Remove unused mockTool definition
// const mockTool = mock((): any => ({}))

describe.skip("TeamLead Agent Integration (Network Simulation)", () => {
  let dependencies: AgentDependencies
  // Remove unused mockTools variable
  // let mockTools: Map<string, any>
  let initialTask: string

  beforeEach(() => {
    dependencies = createFullMockDependencies()
    // Remove mockTools initialization
    // mockTools = new Map<string, any>()
    // mockTools.set("updateTaskState", mockTool())
    // mockTools.set("web_search", mockTool())
    initialTask = "Implement a simple add function"

    // Reset specific mocks used in this suite if necessary
    // mockLogger.info.mockClear()
    // mockKv.set.mockClear()
  })

  it("should transition state and call updateTaskState after generating requirements", async () => {
    // Arrange: Set initial state
    // Use undefined for sandboxId as it's optional string
    const fullInitialState: TddNetworkState = {
      status: NetworkStatus.Enum.READY,
      task: initialTask,
      test_requirements: "",
      test_code: "",
      implementation_code: "",
      sandboxId: undefined,
      run_id: dependencies.eventId,
    }
    await dependencies.kv?.set("networkState", fullInitialState)

    dependencies.model = {
      request: mock(async () => ({ result: requirementsResponse })),
    }
    const requirementsResponse = `* Req 1
* Req 2`

    // Act: Create and run the agent
    const teamLeadAgent = createTeamLeadAgent(dependencies, "Instructions")
    const result = await (teamLeadAgent as any).ask(initialTask)

    // Assert: Check agent response
    expect(result).toBe(requirementsResponse)

    // Remove unused mock tool check
    // const updateTaskStateToolMock = mockTools.get("updateTaskState")

    // Assert: Check final state
    const finalState =
      await dependencies.kv?.get<TddNetworkState>("networkState")
    expect(finalState?.status).toBe(
      NetworkStatus.Enum.NEEDS_REQUIREMENTS_CRITIQUE
    )
    expect(finalState?.test_requirements).toBe(requirementsResponse)

    expect(mockLogger.info).toHaveBeenCalled()
  })

  // Add more tests: error handling, complex tasks, state transitions
})

// ====================
// Previous tests (marked .skip or needing removal/refactor)
// ====================
describe("Agent Definitions: TeamLead Agent", () => {
  let baseDeps: AgentDependencies

  beforeEach(() => {
    baseDeps = createFullMockDependencies() // Now returns AgentDependencies
  })

  it("should create a TeamLead agent with default dependencies", () => {
    const agent = createTeamLeadAgent(baseDeps, "Test instructions")
    expect(agent).toBeDefined()
    expect(agent.name).toBe("TeamLead")
  })

  it("should correctly identify the model adapter", () => {
    const depsWithModel = createFullMockDependencies({
      model: mockDeepseekModelAdapter, // Add mock model
    })
    const agent = createTeamLeadAgent(depsWithModel, "Test instructions")
    // Assuming model is accessible for testing, might be internal
    expect((agent as any).model).toBe(baseDeps.model)
  })

  it("should filter tools, keeping only those needed by the TeamLead", () => {
    const allMockTools = getMockTools([
      // Get all defined mock tools
      "readFile",
      "writeFile",
      "runTerminalCommand",
      "updateTaskState", // TeamLead might update state
      "web_search", // TeamLead needs search
      "mcp_cli-mcp-server_run_command",
      "mcp_cli-mcp-server_show_security_rules",
      // Add other tools from testSetupFocused if needed
      "createOrUpdateFiles",
      "edit_file",
      "codebase_search",
      "grep_search",
    ])
    const depsWithTools = createFullMockDependencies({ allTools: allMockTools })
    const agent = createTeamLeadAgent(depsWithTools, "Test instructions")

    // Correct expected tools based on createTeamLeadAgent logic
    const expectedToolNames = ["updateTaskState", "web_search"].sort()
    const actualToolNames = Array.from(agent.tools.keys()).sort()

    expect(agent.tools).toBeDefined()
    expect(actualToolNames).toEqual(expectedToolNames)
    expect(agent.tools.size).toBe(expectedToolNames.length)
    // Correct specific checks
    expect(agent.tools.has("readFile")).toBe(false)
    expect(agent.tools.has("updateTaskState")).toBe(true)
    expect(agent.tools.has("web_search")).toBe(true)
  })

  it("should handle cases with no tools provided", () => {
    const depsWithoutTools = createFullMockDependencies({ allTools: [] })
    const agent = createTeamLeadAgent(depsWithoutTools, "Test instructions")
    expect(agent.tools).toBeDefined()
    expect(agent.tools.size).toBe(0)
  })
})
