import { describe, it, expect, beforeEach } from "bun:test"
import {
  createFullMockDependencies,
  getMockTools,
  // mockDeepseekModelAdapter,
} from "../setup/testSetupFocused"
import { createTesterAgent } from "@/agents/tester/logic/createTesterAgent"
import type { AgentDependencies } from "@/types/agents"
import type { Tool } from "@inngest/agent-kit"

describe("Tester Agent Unit Tests", () => {
  let baseDeps: AgentDependencies

  beforeEach(() => {
    baseDeps = createFullMockDependencies()
  })

  it("should create a Tester agent with default dependencies", () => {
    const testerAgent = createTesterAgent(baseDeps, "Test instructions")
    expect(testerAgent).toBeDefined()
    expect(testerAgent.name).toBe("Tester")
  })

  it("should filter tools correctly based on tester requirements", () => {
    const allMockTools: Tool<any>[] = getMockTools([
      "readFile",
      "writeFile",
      "runTerminalCommand",
      "updateTaskState",
      "web_search",
      "mcp_cli-mcp-server_run_command",
      "mcp_cli-mcp-server_show_security_rules",
    ])
    const depsWithTools: AgentDependencies = createFullMockDependencies({
      allTools: allMockTools,
    })

    const testerAgent = createTesterAgent(depsWithTools, "Test instructions")

    const expectedToolNames = [
      "runTerminalCommand",
      "readFile",
      "updateTaskState",
    ].sort()

    const actualToolNames = Array.from(testerAgent.tools.keys()).sort()

    expect(actualToolNames).toEqual(expectedToolNames)
    expect(testerAgent.tools.size).toBe(expectedToolNames.length)
  })

  it("should handle having no tools passed in dependencies", () => {
    const depsWithoutTools: AgentDependencies = createFullMockDependencies({
      allTools: [],
    })
    const testerAgent = createTesterAgent(depsWithoutTools, "Test instructions")
    expect(testerAgent.tools).toBeDefined()
    expect(testerAgent.tools.size).toBe(0)
  })
})
