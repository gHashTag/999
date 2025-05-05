import { describe, it, expect, beforeEach } from "bun:test"
import {
  createFullMockDependencies,
  // mockLogger, // Removed unused
  // mockEventId, // Removed unused
  // Use exported function name
  setupTestEnvironment,
  getMockTools,
  createMockTool,
  // Import Tool type
  // mockDeepseekModelAdapter, // Removed unused
} from "../setup/testSetup" // UPDATED PATH
import { createTesterAgent } from "@/agents/tester/logic/createTesterAgent"
// Import AgentDependencies type
import type { AgentDependencies } from "@/types/agents"
// Remove unused Tool import
import type { Tool } from "@inngest/agent-kit"

describe("Agent Definitions: Tester Agent", () => {
  // Use correct type
  let dependencies: AgentDependencies

  beforeEach(() => {
    setupTestEnvironment() // Use exported name
    dependencies = createFullMockDependencies()
  })

  it("should create a Tester agent with correct basic properties", () => {
    const agent = createTesterAgent(dependencies, "Test instructions")
    expect(agent).toBeDefined()
    expect(agent.name).toBe("Tester Agent")
    expect(agent.description).toBeDefined()
    expect((agent as any).model.options.model).toBe(dependencies.modelName)
    expect((agent as any).model.options.apiKey).toBe(dependencies.apiKey)
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

  it("should filter tools correctly", () => {
    const testerTools = getMockTools(["runTerminalCommand", "updateTaskState"])
    dependencies.allTools = [
      ...testerTools,
      createMockTool("other_tool", {}), // Add a tool that should be filtered out
    ]
    const agent = createTesterAgent(dependencies, "Test instructions")
    // Agent tools are stored in agent.tools Map
    const agentToolNames = Array.from(agent.tools?.keys() || [])
    expect(agentToolNames).toEqual(["runTerminalCommand", "updateTaskState"])
    expect(agent.tools?.size).toBe(2)
  })
})
