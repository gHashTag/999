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
import type { AnyTool } from "@/types/agents"

beforeEach(() => {
  setupTestEnvironment()
})

export function runCodingAgentTests() {
  describe("createCodingAgent", () => {
    let dependencies: AgentDependencies

    beforeEach(() => {
      dependencies = {
        allTools: mockTools,
        log: mockLog,
        apiKey: mockApiKey,
        modelName: mockModelName,
        systemEvents: mockSystemEvents,
        sandbox: null,
      }
    })

    it("should create an agent with correct basic properties", () => {
      const instructions = "mock coder instructions"
      const agent = createCodingAgent({ ...dependencies, instructions })
      expect(agent.name).toBe("Coding Agent")
      expect(agent.description).toBeDefined()
      expect(agent.system).toBe(instructions)
      expect(agent.tools).toBeInstanceOf(Map)
      expect(agent.tools.size).toBeGreaterThan(0)
      expect(agent.model).toBeDefined()
    })

    it("should filter tools correctly", () => {
      const mockRunTool: AnyTool = {
        name: "runTerminalCommand",
        handler: vi.fn(),
      }
      const mockWriteTool: AnyTool = {
        name: "createOrUpdateFiles",
        handler: vi.fn(),
      }
      const mockReadTool: AnyTool = { name: "readFiles", handler: vi.fn() }
      const mockAskTool: AnyTool = {
        name: "askHumanForInput",
        handler: vi.fn(),
      }
      const mockUpdateStateTool: AnyTool = {
        name: "updateTaskState",
        handler: vi.fn(),
      }

      const depsWithTools: AgentDependencies = {
        ...dependencies,
        allTools: [
          mockRunTool,
          mockWriteTool,
          mockReadTool,
          mockAskTool,
          mockUpdateStateTool,
        ],
      }
      const agent = createCodingAgent({
        ...depsWithTools,
        instructions: "mock instructions",
      })
      expect(agent.tools.has("runTerminalCommand")).toBe(true)
      expect(agent.tools.has("createOrUpdateFiles")).toBe(true)
      expect(agent.tools.has("readFiles")).toBe(true)
      expect(agent.tools.has("askHumanForInput")).toBe(false)
      expect(agent.tools.has("updateTaskState")).toBe(false)
    })

    // TODO: Add simplified tests for CodingAgent_onFinish (logging only)
  })
}
