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
  let allMockTools: Tool<any>[]

  beforeEach(() => {
    setupTestEnvironment() // Use exported name
    allMockTools = getMockTools() // Предполагается, что эта функция возвращает все моки
    dependencies = createFullMockDependencies({
      tools: allMockTools, // <--- ИЗМЕНЕНО allTools на tools
    })
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
    const agent = createTesterAgent(dependencies, "Test instructions")

    const expectedToolNames = [
      "runTerminalCommand",
      "readFile",
      "updateTaskState",
    ].sort()

    const actualToolNames = Array.from(agent.tools.keys()).sort()

    expect(actualToolNames).toEqual(expectedToolNames)
    expect(agent.tools.size).toBe(expectedToolNames.length)
  })

  it("should handle having no tools passed in dependencies", () => {
    const depsWithoutTools: AgentDependencies = createFullMockDependencies({
      tools: [],
    })
    const testerAgent = createTesterAgent(depsWithoutTools, "Test instructions")
    expect(testerAgent.tools).toBeDefined()
    expect(testerAgent.tools.size).toBe(0)
  })

  it("should filter tools correctly", () => {
    const testerTools = getMockTools(["runTerminalCommand", "updateTaskState"])
    dependencies.tools = [
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
