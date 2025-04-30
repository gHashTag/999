import { describe, it, expect, beforeEach } from "bun:test"
import { createToolingAgent } from "@/agents/tooling/logic/createToolingAgent"
import {
  createBaseMockDependencies,
  getMockTools,
} from "../setup/testSetupFocused"
import { type AgentDependencies } from "@/types/agents"
import type { Tool as AnyTool } from "@inngest/agent-kit"

describe.skip("Tooling Agent Unit Tests (Implementation Pending)", () => {
  let baseDeps: ReturnType<typeof createBaseMockDependencies>
  let toolsForTest: AnyTool<any>[]

  beforeEach(() => {
    baseDeps = createBaseMockDependencies()
    // Global setup hook handles mock reset
  })

  it("should create a Tooling agent with default dependencies", () => {
    const toolingAgent = createToolingAgent({
      ...baseDeps,
      instructions: "Test instructions",
    })
    expect(toolingAgent).toBeDefined()
    expect(toolingAgent.name).toBe("Tooling")
  })

  it("should filter tools correctly", () => {
    const allMockToolsAvailable = getMockTools([
      "readFile",
      "writeFile",
      "runTerminalCommand",
      "updateTaskState",
    ])
    toolsForTest = allMockToolsAvailable
    const depsWithExtraTools: AgentDependencies = {
      ...baseDeps,
      allTools: toolsForTest,
    }
    const toolingAgent = createToolingAgent({
      ...depsWithExtraTools,
      instructions: "Test instructions",
    })
    expect(toolingAgent).toBeDefined()

    const expectedToolName = "runTerminalCommand"
    const expectedTool = getMockTools([expectedToolName])[0]

    expect(toolingAgent.tools.size).toBe(1)
    expect(toolingAgent.tools.get(expectedToolName)).toBe(expectedTool)
  })
})
