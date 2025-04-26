import { describe, it, expect, vi, beforeEach } from "vitest"

import {
  mockLog,
  mockApiKey,
  mockModelName,
  mockSystemEvents,
  mockTools,
  setupTestEnvironment,
  deepseek,
} from "./testSetup"

import { createCodingAgent } from "@/agents"

beforeEach(() => {
  setupTestEnvironment()
})

export function runCodingAgentTests() {
  // --- Tests for createCodingAgent ---
  describe("createCodingAgent", () => {
    it("should create a Coding Agent with correct basic properties", () => {
      const agent = createCodingAgent({
        allTools: mockTools,
        log: mockLog,
        apiKey: mockApiKey,
        modelName: mockModelName,
        systemEvents: mockSystemEvents,
      })
      expect(agent).toBeDefined()
      expect(agent.name).toBe("Coding Agent")
      expect(agent.description).toBeDefined()
      expect(agent.system).toBeDefined()
      expect(agent.tools).toBeInstanceOf(Map)
      expect(agent.tools.size).toBe(5)
      expect(agent.tools.has("web_search")).toBe(true)
      expect(agent.tools.has("codebase_search")).toBe(true)
      expect(agent.tools.has("grep_search")).toBe(true)
      expect(agent.tools.has("edit_file")).toBe(true)
      expect(agent.tools.has("read_file")).toBe(true)
      expect(agent.model).toBeDefined()
      expect(vi.mocked(deepseek)).toHaveBeenCalledWith({
        apiKey: mockApiKey,
        model: mockModelName,
      })
    })

    // TODO: Add simplified tests for CodingAgent_onFinish (logging only)
  })
}
