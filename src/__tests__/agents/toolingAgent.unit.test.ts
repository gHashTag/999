import { describe, it, expect, beforeEach } from "bun:test"
import {
  createFullMockDependencies,
  mockLoggerInstance,
  setupTestEnvironment,
} from "../setup/testSetup"
import { createToolingAgent } from "@/agents/tooling/logic/createToolingAgent"
import type { AgentDependencies } from "@/types/agents"
// Import Tool type
// import { Tool } from "@inngest/agent-kit" // Tool type is likely not needed here

describe("Agent Definitions: Tooling Agent", () => {
  let dependencies: AgentDependencies

  beforeEach(() => {
    setupTestEnvironment()
    dependencies = createFullMockDependencies({ log: mockLoggerInstance })
  })

  it("should create a Tooling agent with correct basic properties", () => {
    const agent = createToolingAgent(dependencies, "Default instructions")
    expect(agent).toBeDefined()
    expect(agent.name).toBe("Tooling Agent")
    expect(agent.description).toBeDefined()
    expect((agent as any).model.options.model).toBe(dependencies.modelName)
    expect((agent as any).model.options.apiKey).toBe(dependencies.apiKey)
  })

  it("should filter tools correctly (exclude disallowed)", () => {
    const allMockTools = dependencies.allTools
    const allToolNames = allMockTools.map(t => t.name)
    expect(allToolNames).toContain("askHumanForInput")

    const agent = createToolingAgent(dependencies, "Filter tools")

    const expectedToolNames = allToolNames
      .filter(name => name !== "askHumanForInput")
      .sort()

    const actualToolNames = Array.from(agent.tools.keys()).sort()

    expect(actualToolNames).toEqual(expectedToolNames)
    expect(agent.tools.size).toBe(expectedToolNames.length)
  })
})
