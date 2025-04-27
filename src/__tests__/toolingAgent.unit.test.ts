import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  mockDeepseekModel,
  createBaseMockDependencies,
  getMockTools,
  setupTestEnvironmentFocused,
} from "./testSetupFocused" // Import setup and mocks
import { createToolingAgent } from "@/agents/tooling/logic/createToolingAgent" // Import the function to test
import type { Tool } from "@inngest/agent-kit"

describe("createToolingAgent Unit Test (Focused)", () => {
  beforeEach(() => {
    setupTestEnvironmentFocused() // Reset mocks if needed
  })

  it("should create a Tooling agent with correct basic properties and expected tools", () => {
    const baseDeps = createBaseMockDependencies()
    const expectedToolNames = [
      "runTerminalCommand",
      "readFile",
      "createOrUpdateFiles",
      "edit_file",
      "codebase_search",
      "grep_search",
      // Add other tools expected for Tooling agent if any
    ]
    const mockToolsForAgent: Tool<any>[] = getMockTools(expectedToolNames)

    // Create the agent
    const toolingAgent = createToolingAgent({
      ...baseDeps,
      instructions: "Test instructions for Tooling Agent", // Provide mock instructions
      allTools: mockToolsForAgent, // Provide the full set of expected mock tools
      agents: {}, // Provide empty agents object if needed
    })

    // Basic Assertions
    expect(toolingAgent).toBeDefined()
    expect(toolingAgent.name).toEqual("Tooling Agent")
    expect(toolingAgent.description).toEqual(
      "Executes tools and commands related to the environment, filesystem, and processes."
    )
    expect(toolingAgent.model).toBeDefined()

    // Check Tools
    expect(toolingAgent.tools).toBeDefined() // Check agent.tools directly
    expect(toolingAgent.tools).toBeInstanceOf(Map) // Ensure it's a Map
    expect(toolingAgent.tools.size).toEqual(expectedToolNames.length) // Check agent.tools.size

    // Verify that the names of the tools passed match the expected names
    const agentToolNames = Array.from(toolingAgent.tools.keys()) // Get keys from the Map
    expect(agentToolNames).toEqual(expect.arrayContaining(expectedToolNames))
    expect(expectedToolNames).toEqual(expect.arrayContaining(agentToolNames)) // Ensure no extra tools
  })

  it("should handle creation even if no specific tools are provided (uses empty array)", () => {
    const baseDeps = createBaseMockDependencies()

    // Simulate no tools being passed (or filtering results in empty)
    const toolingAgent = createToolingAgent({
      ...baseDeps,
      instructions: "Test instructions for Tooling Agent",
      allTools: [], // Pass empty array
      agents: {},
    })

    expect(toolingAgent).toBeDefined()
    expect(toolingAgent.tools).toBeDefined() // Check agent.tools directly
    expect(toolingAgent.tools.size).toEqual(0) // Check agent.tools.size
  })

  // Add more tests if needed, e.g., testing specific logic within createToolingAgent
})
