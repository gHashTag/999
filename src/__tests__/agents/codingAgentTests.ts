import { describe, it, expect, vi, beforeEach } from "vitest"

import {
  mockLog,
  mockApiKey,
  mockModelName,
  mockSystemEvents,
  mockTools,
  setupTestEnvironment,
  type _AgentDependencies as AgentDependencies,
} from "./testSetup"

import { createCodingAgent } from "@/agents"
import { deepseek } from "@inngest/ai/models" // Import deepseek directly

beforeEach(() => {
  setupTestEnvironment()
})

export function runCodingAgentTests() {
  // --- Tests for createCodingAgent ---
  describe("createCodingAgent", () => {
    let dependencies: AgentDependencies

    beforeEach(async () => {
      dependencies = {
        allTools: mockTools,
        log: mockLog,
        apiKey: mockApiKey,
        modelName: mockModelName,
        systemEvents: mockSystemEvents,
        sandbox: null,
      }
    })

    it("should create a Coding Agent with correct basic properties", () => {
      const agent = createCodingAgent(dependencies)
      expect(agent).toBeDefined()
      expect(agent.name).toBe("Coding Agent")
      expect(agent.description).toBeDefined()
      expect(agent.system).toBeDefined()
      expect(agent.tools).toBeInstanceOf(Map)
      expect(agent.tools.size).toBe(5)
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

    it("should create Coding Agent with correct tools", () => {
      const agent = createCodingAgent(dependencies)
      // Check for specific tools needed by the Coder
      expect(agent.tools.has("readFile")).toBe(true)
      expect(agent.tools.has("writeFile")).toBe(true)
      expect(agent.tools.has("runCommand")).toBe(true)
      expect(agent.tools.has("updateTaskState")).toBe(true)
      // expect(agent.tools.has("web_search")).toBe(true); // Commented out web_search check
      expect(agent.tools.has("askHumanForInput")).toBe(false) // Should not have this
    })

    // TODO: Add simplified tests for CodingAgent_onFinish (logging only)
  })
}
