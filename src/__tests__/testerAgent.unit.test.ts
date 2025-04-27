// Adapted from src/__tests_backup__/agents/testerAgentTests.ts

import { describe, it, expect, beforeEach } from "vitest"
import { Agent } from "@inngest/agent-kit"
import {
  createBaseMockDependencies,
  getMockTools,
  setupTestEnvironmentFocused,
} from "./testSetupFocused"
import { createTesterAgent } from "@/agents/tester/logic/createTesterAgent"

// Use placeholder string for instructions
const AGENT_Tester_Instructions = "Mock Tester Instructions for Test"

describe("createTesterAgent Unit Test (Focused)", () => {
  beforeEach(() => {
    setupTestEnvironmentFocused()
  })

  it("should create a Tester agent with correct basic properties and tools", () => {
    // Base dependencies needed by createTesterAgent
    const baseDeps = {
      ...createBaseMockDependencies(),
    }

    // Get ALL mock tools needed for filtering check
    const allMockToolsInput = getMockTools([
      "readFile",
      "runTerminalCommand",
      "updateTaskState",
      "web_search",
      "edit_file",
    ])

    // Create the agent
    const testerAgent = createTesterAgent({
      instructions: AGENT_Tester_Instructions,
      ...baseDeps,
      allTools: allMockToolsInput,
    })

    // Basic Properties Check
    expect(testerAgent).toBeInstanceOf(Agent)
    expect(testerAgent.name).toBe("Tester Agent") // Verify actual name
    expect(testerAgent.description).toBe(
      "Создает или выполняет команды для создания тестов, запускает тесты и анализирует результаты."
    ) // Verify actual description

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
