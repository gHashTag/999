import { describe, it, expect, beforeEach } from "bun:test"
import {
  createFullMockDependencies,
  setupTestEnvironment,
  getMockTools,
  createMockTool,
  mockLoggerInstance,
} from "../setup/testSetup"
import { createToolingAgent } from "@/agents/tooling/logic/createToolingAgent"
import type { AgentDependencies } from "@/types/agents"
// Import Tool type
// import { Tool } from "@inngest/agent-kit" // Tool type is likely not needed here

describe("Tooling Agent Unit Tests", () => {
  let baseDeps: AgentDependencies

  beforeEach(() => {
    setupTestEnvironment()
    baseDeps = createFullMockDependencies({ log: mockLoggerInstance })
  })

  it("should create a Tooling agent with default dependencies", () => {
    // Pass dependencies and mock instructions in a single object
    const agent = createToolingAgent({
      ...baseDeps,
      instructions: "Default instructions",
    })
    expect(agent).toBeDefined()
    // Corrected expected name based on implementation
    expect(agent.name).toBe("Tooling Agent")
  })

  it("should filter tools correctly", () => {
    const toolingTools = getMockTools([
      "readFile",
      "writeFile",
      "runTerminalCommand",
      "updateTaskState", // Tooling might update state too
    ])
    const depsWithTools = {
      ...baseDeps,
      allTools: [
        ...toolingTools,
        createMockTool("web_search", {}), // Add a tool that should be filtered out
      ],
    }

    // Pass dependencies and specific instructions in a single object
    const agentWithInstructions = createToolingAgent({
      ...depsWithTools,
      instructions: "Filter tools",
    })
    // Agent tools are stored in agent.tools Map
    const agentToolNames = Array.from(
      agentWithInstructions.tools?.keys() || []
    ).sort()
    const expectedToolNames = [
      "readFile",
      "writeFile",
      "runTerminalCommand",
      "updateTaskState",
    ].sort()
    expect(agentToolNames).toEqual(expectedToolNames)
    expect(agentWithInstructions.tools?.size).toBe(4)
  })
})
