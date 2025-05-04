import { describe, it, expect, beforeEach } from "bun:test"
import {
  createFullMockDependencies,
  getMockTools,
  mockDeepseekModelAdapter,
  mockLoggerInstance,
} from "../setup/testSetup"
import { createCriticAgent } from "@/agents/critic/logic/createCriticAgent"
import type { AgentDependencies } from "@/types/agents"

describe("Critic Agent Unit Tests", () => {
  let baseDeps: AgentDependencies

  beforeEach(() => {
    baseDeps = createFullMockDependencies({ log: mockLoggerInstance })
  })

  it("should create a Critic agent with default dependencies", () => {
    const criticAgent = createCriticAgent(baseDeps, "Test instructions")
    expect(criticAgent).toBeDefined()
    expect(criticAgent.name).toBe("Critic")
  })

  it("should have access to the correct model adapter", () => {
    const criticAgent = createCriticAgent(baseDeps, "Test instructions")
    expect((criticAgent as any).model.options.model).toBe(baseDeps.modelName)
    expect((criticAgent as any).model.options.apiKey).toBe(baseDeps.apiKey)
  })

  it("should filter tools correctly based on critic requirements", () => {
    const allMockTools = getMockTools([
      "readFile",
      "writeFile",
      "web_search",
      "updateTaskState",
      "mcp_cli-mcp-server_run_command",
    ])
    const depsWithTools: AgentDependencies = {
      ...baseDeps,
      allTools: allMockTools,
      log: mockLoggerInstance,
    }
    const criticAgent = createCriticAgent(depsWithTools, "Test instructions")

    const expectedToolNames = ["updateTaskState", "web_search"].sort()

    const actualToolNames = Array.from(criticAgent.tools.keys()).sort()

    expect(actualToolNames).toEqual(expectedToolNames)
    expect(criticAgent.tools.size).toBe(expectedToolNames.length)
  })
})

describe("Agent Definitions: Critic Agent", () => {
  let baseDeps: AgentDependencies
  let allMockTools: any[]

  beforeEach(() => {
    baseDeps = createFullMockDependencies()
    allMockTools = getMockTools([
      "readFile",
      "writeFile",
      "runTerminalCommand",
      "updateTaskState",
      "web_search",
      "mcp_cli-mcp-server_run_command",
      "mcp_cli-mcp-server_show_security_rules",
    ])
  })

  it("should create a Critic agent with default dependencies", () => {
    const agent = createCriticAgent(baseDeps, "Test instructions")
    expect(agent).toBeDefined()
    expect(agent.name).toBe("Critic")
  })

  it("should correctly identify the model adapter", () => {
    const depsWithModel = createFullMockDependencies({
      model: mockDeepseekModelAdapter,
    })
    const agent = createCriticAgent(depsWithModel, "Test instructions")
    expect((agent as any).model.options.model).toBe(baseDeps.modelName)
    expect((agent as any).model.options.apiKey).toBe(baseDeps.apiKey)
  })

  it("should filter tools, keeping only those needed by the Critic", () => {
    const depsWithTools = createFullMockDependencies({ allTools: allMockTools })
    const agent = createCriticAgent(depsWithTools, "Test instructions")
    expect(agent.tools).toBeDefined()
    expect(agent.tools.size).toBe(2)
    expect(agent.tools.has("readFile")).toBe(false)
    expect(agent.tools.has("writeFile")).toBe(false)
    expect(agent.tools.has("web_search")).toBe(true)
    expect(agent.tools.has("runTerminalCommand")).toBe(false)
    expect(agent.tools.has("updateTaskState")).toBe(true)
  })

  it("should handle cases with no tools provided", () => {
    const depsWithoutTools = createFullMockDependencies({ allTools: [] })
    const agent = createCriticAgent(depsWithoutTools, "Test instructions")
    expect(agent.tools).toBeDefined()
    expect(agent.tools.size).toBe(0)
  })
})
