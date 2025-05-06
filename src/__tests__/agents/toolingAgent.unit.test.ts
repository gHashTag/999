import { describe, it, expect, beforeEach } from "bun:test"
import {
  createFullMockDependencies,
  // mockLoggerInstance,
  // setupTestEnvironment,
  setupTestEnvironment,
} from "../setup/testSetup"
import { createToolingAgent } from "@/agents/tooling/logic/createToolingAgent"
import type { AgentDependencies } from "@/types/agents"
import { getMockTools } from "../setup/testSetup"
// Import Tool type
// import { Tool } from "@inngest/agent-kit" // Tool type is likely not needed here

describe("Unit Тесты для Tooling Agent", () => {
  let dependencies: AgentDependencies
  // let allMockTools: Tool<any>[]; // Не используется здесь, т.к. Tooling агент должен иметь все инструменты

  beforeEach(() => {
    setupTestEnvironment()
    // Для Tooling агента, мы ожидаем, что он получит ВСЕ инструменты, так что передаем их все
    dependencies = createFullMockDependencies({
      tools: getMockTools(), // <--- ИЗМЕНЕНО allTools на getMockTools()
    })
  })

  it("должен инициализироваться и содержать ВСЕ доступные инструменты", () => {
    const agent = createToolingAgent(dependencies, "Default instructions")
    const allMockToolsFromDep = dependencies.tools
    expect(agent.tools.size).toBe(allMockToolsFromDep.length)

    allMockToolsFromDep.forEach(tool => {
      expect(agent.tools.has(tool.name)).toBe(true)
    })
  })

  it("не должен фильтровать инструменты, кроме askHumanForInput", () => {
    const agent = createToolingAgent(dependencies, "Default instructions")
    const allToolNames = (dependencies.tools || []).map(t => t.name)
    const expectedAgentTools = allToolNames.filter(
      name => name !== "askHumanForInput"
    )

    expect(agent.tools.size).toBe(expectedAgentTools.length)
    expectedAgentTools.forEach(toolName => {
      expect(agent.tools.has(toolName)).toBe(true)
    })
    expect(agent.tools.has("askHumanForInput")).toBe(false) // Убедимся, что он отфильтрован
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
    const allMockTools = dependencies.tools
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
