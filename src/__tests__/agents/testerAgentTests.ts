import { describe, it, expect, beforeEach } from "vitest"

import {
  mockLog,
  mockApiKey,
  mockModelName,
  mockSystemEvents,
  mockTools,
  // mockAgentDeps, // Import if needed directly
  setupTestEnvironment, // Import setup function
  type _AgentDependencies as AgentDependencies, // Import type with alias
  // deepseek, // Removed from re-export
} from "./testSetup"

import type {} from // AvailableAgent, // Removed unused import
"@/types/agents" // Correct path for types

import { createTesterAgent } from "@/agents"
// import { deepseek } from "@inngest/ai/models" // Removed unused import

// Call setup before each test in this file
beforeEach(() => {
  setupTestEnvironment() // Use the imported setup function
})

export function runTesterAgentTests() {
  // --- Tests for createTesterAgent ---
  describe("createTesterAgent", () => {
    let dependencies: AgentDependencies
    // let availableAgents: AvailableAgent[] // Removed

    beforeEach(async () => {
      dependencies = {
        allTools: mockTools,
        log: mockLog,
        apiKey: mockApiKey,
        modelName: mockModelName,
        systemEvents: mockSystemEvents,
        sandbox: null,
      }
      // availableAgents = [] // Removed
    })

    it("should create a Tester Agent with correct basic properties", () => {
      const agent = createTesterAgent(dependencies)
      expect(agent).toBeDefined()
      expect(agent.name).toBe("Tester Agent")
      expect(agent.description).toBeDefined()
      expect(agent.model).toBeDefined()
    })

    it("should create Tester Agent with correct filtered tools", () => {
      const agent = createTesterAgent(dependencies)
      // Tester mainly needs state update and maybe command execution
      expect(agent.tools.has("updateTaskState")).toBe(true)
      expect(agent.tools.has("runTerminalCommand")).toBe(true)
      // expect(agent.tools.has("web_search")).toBe(true); // Commented out web_search check
      expect(agent.tools.size).toBe(2) // Should only have 2 tools now
    })

    // No system prompt test needed for Tester as it's static
  })
}
