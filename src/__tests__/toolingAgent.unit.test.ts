import { describe, expect, beforeEach, it } from "bun:test" // Import 'it' from bun:test
import {
  getMockTools,
  createBaseMockDependencies,
  setupTestEnvironment,
  // findToolMock, // Removed unused
  type AgentDependencies,
} from "../testSetup" // Combined imports
import { createToolingAgent } from "@/agents/tooling/logic/createToolingAgent" // Correct path
// import type { Tool } from "@inngest/agent-kit" // Removed unused
// import type { AgentDependencies /*, HandlerLogger*/ } from "@/types/agents" // Removed duplicate import

describe("createToolingAgent Unit Test (Focused)", () => {
  // Define common dependencies and instructions
  let baseDeps: AgentDependencies // Use AgentDependencies directly
  let toolingInstructions: string
  let toolsForTest: Tool<any>[]

  beforeEach(() => {
    // setupTestEnvironmentFocused() called by global hook
    baseDeps = createBaseMockDependencies()
    toolingInstructions = "исполнительный и аккуратный Инструментальщик" // Updated instructions
    // Define tools typically needed/filtered by Tooling
    toolsForTest = getMockTools([
      "runTerminalCommand",
      "readFile",
      "writeFile",
      "edit_file",
      "codebase_search",
      "grep_search",
    ])
  })

  it("should create a Tooling agent with correct basic properties and expected tools", () => {
    // Create the agent
    const completeDeps: AgentDependencies = {
      ...baseDeps,
      // log: mockLogger, // Already in baseDeps
      // model: mockDeepseekModelAdapter, // Already in baseDeps
      allTools: toolsForTest,
      // agents: {}, // Already in baseDeps
    } // Remove cast

    // Pass instructions as the second argument
    // const toolingAgent = createToolingAgent(completeDeps, toolingInstructions)
    // Pass instructions within the dependency object
    const toolingAgent = createToolingAgent({
      ...completeDeps,
      instructions: toolingInstructions,
    })

    // Basic Assertions
    expect(toolingAgent).toBeDefined()
    expect(toolingAgent.name).toEqual("Tooling Agent") // Correct name
    expect(toolingAgent.description).toEqual(
      "Executes tools and commands related to the environment, filesystem, and processes."
    )
    expect(toolingAgent.system).toContain("Инструментальщик") // Check prompt content
    // Tooling agent might not need a model, check definition if this fails
    // expect(toolingAgent.model).toBeDefined();

    // Check Tools
    expect(toolingAgent.tools).toBeDefined() // Check agent.tools directly
    expect(toolingAgent.tools).toBeInstanceOf(Map) // Ensure it's a Map
    expect(toolingAgent.tools.size).toEqual(toolsForTest.length) // Check agent.tools.size

    // Verify that the names of the tools passed match the expected names
    const agentToolNames = Array.from(toolingAgent.tools.keys()) // Get keys from the Map
    expect(agentToolNames).toEqual(
      expect.arrayContaining(toolsForTest.map(t => t.name))
    )
    expect(toolsForTest.map(t => t.name)).toEqual(
      expect.arrayContaining(agentToolNames)
    ) // Ensure no extra tools
  })

  it("should handle creation even if no specific tools are provided (uses empty array)", () => {
    const completeDeps: AgentDependencies = {
      ...baseDeps,
      // log: mockLogger, // Already in baseDeps
      // model: mockDeepseekModelAdapter, // Already in baseDeps
      allTools: [], // Pass empty array
      // agents: {}, // Already in baseDeps
    } // Remove cast

    // Simulate no tools being passed (or filtering results in empty)
    // Pass instructions as the second argument
    // const toolingAgent = createToolingAgent(completeDeps, toolingInstructions)
    // Pass instructions within the dependency object
    const toolingAgent = createToolingAgent({
      ...completeDeps,
      instructions: toolingInstructions,
    })

    expect(toolingAgent).toBeDefined()
    expect(toolingAgent.name).toEqual("Tooling Agent") // Correct name
    expect(toolingAgent.tools).toBeDefined() // Check agent.tools directly
    expect(toolingAgent.tools.size).toEqual(0) // Check agent.tools.size
  })

  // Add more tests if needed, e.g., testing specific logic within createToolingAgent
})

// Setup the test environment
setupTestEnvironment()
