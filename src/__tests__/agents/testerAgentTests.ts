import { describe, it, expect, vi, beforeEach } from "vitest"

import {
  mockLog,
  mockApiKey,
  mockModelName,
  mockSystemEvents,
  mockTools,
  // mockAgentDeps, // Import if needed directly
  setupTestEnvironment,
  deepseek,
} from "./testSetup"

import { createTesterAgent } from "@/agents"

// Call setup before each test in this file
beforeEach(() => {
  setupTestEnvironment()
})

export function runTesterAgentTests() {
  // --- Tests for createTesterAgent ---
  describe("createTesterAgent", () => {
    it("should create a Tester Agent with correct basic properties", () => {
      const agent = createTesterAgent({
        allTools: mockTools, // Use imported mock
        log: mockLog, // Use imported mock
        apiKey: mockApiKey, // Use imported mock
        modelName: mockModelName, // Use imported mock
        systemEvents: mockSystemEvents, // Use imported mock
      })

      expect(agent).toBeDefined()
      expect(agent.name).toBe("Tester Agent")
      expect(agent.description).toBeDefined()
      expect(agent.system).toBeDefined()
      expect(agent.tools).toBeInstanceOf(Map)
      expect(agent.tools.size).toBe(1)
      expect(agent.tools.has("web_search")).toBe(true)
      expect(agent.model).toBeDefined()
      // Check if deepseek mock was called correctly
      expect(vi.mocked(deepseek)).toHaveBeenCalledWith({
        apiKey: mockApiKey,
        model: mockModelName,
      })
    })

    // describe("onFinish Hook (Simplified)", () => { ... }); // Keep commented out for now
  })
}
