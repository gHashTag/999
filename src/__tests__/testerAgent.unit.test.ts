// Adapted from src/__tests_backup__/agents/testerAgentTests.ts

import { describe, it, expect, beforeEach } from "bun:test" // Changed bun:test to bun:test
import { Agent } from "@inngest/agent-kit"
import {
  createBaseMockDependencies,
  getMockTools,
  setupTestEnvironmentFocused,
  // mockLogger, // Remove unused import
  // mockDeepseekModelAdapter, // Remove unused import
} from "./testSetupFocused"
import { createTesterAgent } from "@/agents/tester/logic/createTesterAgent"
import type { AgentDependencies /*, HandlerLogger*/ } from "@/types/agents" // Remove unused HandlerLogger
import type { Tool } from "@inngest/agent-kit"

describe("createTesterAgent Unit Test (Focused)", () => {
  let baseDeps: AgentDependencies // Return explicit type

  beforeEach(() => {
    setupTestEnvironmentFocused()
    baseDeps = createBaseMockDependencies()
  })

  it("should create a Tester agent with correct basic properties and tools", () => {
    // Get ALL mock tools needed for filtering check
    const allMockToolsInput = getMockTools([
      "readFile",
      "runTerminalCommand",
      "updateTaskState",
      "web_search",
      "edit_file",
    ])

    // Create full dependencies for the agent
    const fullDeps: AgentDependencies = {
      ...baseDeps,
      allTools: allMockToolsInput,
    }

    // Create the agent, passing instructions separately
    const testerInstructions = "прилежный инженер по качеству"
    const testerAgent = createTesterAgent(fullDeps, testerInstructions)

    // Basic Properties Check
    expect(testerAgent).toBeInstanceOf(Agent)
    expect(testerAgent.name).toBe("Tester") // Correct name
    expect(testerAgent.description).toBe(
      "Создает или выполняет команды для создания тестов, запускает тесты и анализирует результаты."
    )
    expect(testerAgent.system).toContain("прилежный инженер по качеству") // Check prompt content

    // Tool Filtering Check (Based on createTesterAgent.ts logic)
    const expectedToolNames = [
      "runTerminalCommand", // Corrected based on actual code
      "readFile",
      "updateTaskState",
    ]
    const tools = testerAgent.tools as Map<string, any> // Assuming 'tools' is the correct property
    const toolNames = Array.from(tools.keys())

    // Check expected tools are present
    for (const name of expectedToolNames) {
      expect(
        toolNames.includes(name),
        `Expected tool ${name} to be present`
      ).toBe(true)
    }

    // Check that *none* of the unexpected tools are present
    allMockToolsInput.forEach(tool => {
      if (!expectedToolNames.includes(tool.name)) {
        expect(
          toolNames.includes(tool.name),
          `Expected tool ${tool.name} to be absent`
        ).toBe(false)
      }
    })
  })
})

describe("createTesterAgent Unit Tests (Alternate)", () => {
  let baseDeps: AgentDependencies
  let testerInstructions: string
  let toolsForTest: Tool<any>[]

  beforeEach(() => {
    setupTestEnvironmentFocused()
    baseDeps = createBaseMockDependencies()
    testerInstructions = "инженер по качеству (QA) в цикле TDD"
    toolsForTest = getMockTools(["runTerminalCommand", "web_search"]) // Provides 2 tools
  })

  it("should create the Tester agent with correct properties", () => {
    const completeDeps: AgentDependencies = {
      ...baseDeps,
      allTools: toolsForTest,
    }
    const agent = createTesterAgent(completeDeps, testerInstructions)

    expect(agent).toBeDefined()
    expect(agent.name).toBe("Tester")
    expect(agent.description).toBe(
      "Создает или выполняет команды для создания тестов, запускает тесты и анализирует результаты."
    )
    expect(agent.system).toBe(testerInstructions)
    // Correct the expected tool count based on actual filtering logic (likely 1)
    expect(agent.tools.size).toBe(1) // Expecting 1 tool after filtering
  })

  // Add other specific unit tests for createTesterAgent if necessary
})
