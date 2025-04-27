import { describe, it, expect, vi, beforeEach } from "vitest"

import {
  mockLogger,
  mockApiKey,
  mockModelName,
  mockSystemEvents,
  mockTools,
  setupTestEnvironmentFocused,
  type AgentDependencies,
} from "../testSetupFocused"

import { createCodingAgent } from "@/agents"
import { Tool } from "@inngest/agent-kit"

export function runCodingAgentTests() {
  describe("createCodingAgent", () => {
    let dependencies: AgentDependencies

    beforeEach(() => {
      setupTestEnvironmentFocused()
      dependencies = {
        allTools: mockTools,
        log: mockLogger,
        apiKey: mockApiKey,
        modelName: mockModelName,
        eventId: "mock-event-id",
        model: vi.fn() as any,
        systemEvents: mockSystemEvents,
        sandbox: null,
      }
    })

    it("should create an agent with correct basic properties", () => {
      const instructions = "mock coder instructions"
      const agent = createCodingAgent({ ...dependencies, instructions })
      expect(agent.name).toBe("Coder Agent")
      expect(agent.description).toBeDefined()
      expect(agent.tools).toBeInstanceOf(Map)
      expect(agent.tools.size).toBeGreaterThan(0)
      expect(agent.model).toBeDefined()
    })

    it("should filter tools correctly", () => {
      const mockRunTool: Tool<any> = {
        name: "runTerminalCommand",
        handler: vi.fn(),
      }
      const mockWriteTool: Tool<any> = {
        name: "createOrUpdateFiles",
        handler: vi.fn(),
      }
      const mockReadTool: Tool<any> = { name: "readFiles", handler: vi.fn() }
      const mockAskTool: Tool<any> = {
        name: "askHumanForInput",
        handler: vi.fn(),
      }
      const mockUpdateStateTool: Tool<any> = {
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
