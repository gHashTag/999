import { describe, it, expect, beforeEach } from "bun:test" // Add beforeEach
import { createTeamLeadAgent } from "@/agents/teamlead/logic/createTeamLeadAgent" // Corrected path based on assumption
import {
  // setupTestEnvironmentFocused as setupTestEnvironment, // Removed unused alias
  createBaseMockDependencies,
  // getMockTools, // Removed unused
  type AgentDependencies,
} from "../setup/testSetupFocused"

// Global setup hook handles beforeEach

describe("TeamLead Agent Unit Tests", () => {
  let baseDeps: AgentDependencies

  beforeEach(() => {
    baseDeps = createBaseMockDependencies()
  })

  it("should create a TeamLead agent with correct properties", () => {
    const agent = createTeamLeadAgent(baseDeps, "Test instructions")
    expect(agent.name).toBe("TeamLead")
    expect(agent.description).toBeDefined()
    expect(agent.model).toBe(baseDeps.model)
  })

  it("should filter tools, expecting web_search and updateTaskState", () => {
    const agent = createTeamLeadAgent(baseDeps, "Test instructions")
    const expectedToolNames = ["web_search", "updateTaskState"]
    const actualToolNames = Array.from(
      agent.tools.values() as IterableIterator<{ name: string }>
    )
      .map((t: { name: string }) => t.name)
      .sort()

    expect(agent.tools.size).toBe(expectedToolNames.length)
    expect(actualToolNames).toEqual(expectedToolNames.sort())

    // Check others are filtered out
    expect(agent.tools.has("readFile")).toBe(false)
    expect(agent.tools.has("runTerminalCommand")).toBe(false)
    expect(agent.tools.has("mcp_cli-mcp-server_run_command")).toBe(false)
  })
})
