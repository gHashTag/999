import { describe, it, expect, beforeEach } from "bun:test"
import {
  // createBaseMockDependencies, // Deprecated
  createFullMockDependencies, // Use new factory
  getMockTools,
  // mockDeepseekModelAdapter, // Remove unused
} from "../setup/testSetupFocused"
import { createTeamLeadAgent } from "@/agents/teamlead/logic/createTeamLeadAgent"
import type { AgentDependencies } from "@/types/agents"

describe("TeamLead Agent Unit Tests", () => {
  let baseDeps: AgentDependencies

  beforeEach(() => {
    baseDeps = createFullMockDependencies() // Use new factory
  })

  it("should create a TeamLead agent with default dependencies", () => {
    const agent = createTeamLeadAgent(baseDeps, "Test instructions")
    expect(agent).toBeDefined()
    expect(agent.name).toBe("TeamLead")
  })

  it("should have access to the correct model adapter", () => {
    const agent = createTeamLeadAgent(baseDeps, "Test instructions")
    expect((agent as any).model).toBe(baseDeps.model)
  })

  it("should filter tools correctly based on teamlead requirements", () => {
    const allMockTools = getMockTools([
      "readFile",
      "writeFile",
      "runTerminalCommand",
      "updateTaskState", // TeamLead needs this
      "web_search", // TeamLead needs this
      "mcp_cli-mcp-server_run_command",
      "mcp_cli-mcp-server_show_security_rules",
    ])
    const depsWithTools = createFullMockDependencies({
      allTools: allMockTools,
    })
    const agent = createTeamLeadAgent(depsWithTools, "Test instructions")

    const expectedToolNames = ["updateTaskState", "web_search"].sort()
    const actualToolNames = Array.from(agent.tools.keys()).sort()

    expect(actualToolNames).toEqual(expectedToolNames)
    expect(agent.tools.size).toBe(expectedToolNames.length)
  })

  it("should handle having no tools passed in dependencies", () => {
    const depsWithoutTools = createFullMockDependencies({ allTools: [] })
    const agent = createTeamLeadAgent(depsWithoutTools, "Test instructions")
    expect(agent.tools).toBeDefined()
    expect(agent.tools.size).toBe(0)
  })
})
