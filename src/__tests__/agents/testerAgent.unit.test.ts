import { describe, it, expect } from "bun:test" // Keep only used test functions
import {
  createBaseMockDependencies,
  getMockTools,
} from "../setup/testSetupFocused"
import { createTesterAgent } from "@/agents/tester/logic/createTesterAgent"
import { type AgentDependencies } from "@/types/agents"

// Global setup is handled by the hook in testSetupFocused.ts

describe.skip("Tester Agent Unit Tests", () => {
  // beforeEach is handled globally

  it("should create a Tester agent with default dependencies", () => {
    const baseDeps = createBaseMockDependencies()
    const testerAgent = createTesterAgent(baseDeps, "Test instructions")

    expect(testerAgent).toBeDefined()
    expect(testerAgent.name).toBe("Tester")
    expect(testerAgent.description).toBeDefined()
  })

  it("should create a Tester agent with specific tools provided in dependencies", () => {
    const baseDeps = createBaseMockDependencies()
    const specificTools = getMockTools(["readFile", "runTerminalCommand"])
    const depsWithTools: AgentDependencies = {
      ...baseDeps,
      allTools: specificTools,
    }
    const testerAgent = createTesterAgent(depsWithTools, "Test instructions")

    expect(testerAgent).toBeDefined()
    expect(testerAgent.name).toBe("Tester")
    expect(testerAgent.tools).toEqual(
      new Map(specificTools.map(t => [t.name, t]))
    )
  })

  it("should filter tools based on its needs if filtering logic exists", () => {
    const baseDeps = createBaseMockDependencies()
    const allMockToolsAvailable = getMockTools([
      "readFile",
      "writeFile",
      "runTerminalCommand",
      "updateTaskState",
    ])
    const depsWithExtraTools: AgentDependencies = {
      ...baseDeps,
      allTools: allMockToolsAvailable,
    }
    const testerAgent = createTesterAgent(
      depsWithExtraTools,
      "Test instructions"
    )

    expect(testerAgent).toBeDefined()
    const expectedToolNames = ["readFile", "runTerminalCommand"]
    const expectedTools = getMockTools(expectedToolNames)
    const sortByName = (a: { name: string }, b: { name: string }) =>
      a.name.localeCompare(b.name)

    const agentToolsSorted = Array.from(testerAgent.tools.values()).sort(
      sortByName
    )
    expect(agentToolsSorted).toEqual(expectedTools.sort(sortByName))
    expect(testerAgent.tools.size).toBe(expectedToolNames.length)
  })

  // Add more specific tests for TesterAgent if needed
})
