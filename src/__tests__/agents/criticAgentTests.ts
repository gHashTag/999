import { describe, it, expect, vi, beforeEach } from "vitest"

import {
  mockLog,
  mockApiKey,
  mockModelName,
  mockSystemEvents,
  mockTools,
  setupTestEnvironment,
  type AnyTool, // Import AnyTool if needed for casting
  type TddNetworkState, // Import TddNetworkState for casting
  NetworkStatus, // Import NetworkStatus for enum usage
} from "./testSetup"

import { createCriticAgent } from "@/agents"

beforeEach(() => {
  setupTestEnvironment()
})

export function runCriticAgentTests() {
  // --- Tests for createCriticAgent ---
  describe("createCriticAgent", () => {
    it("should create a Critic Agent with correct basic properties", () => {
      const agent = createCriticAgent({
        allTools: mockTools,
        log: mockLog,
        apiKey: mockApiKey,
        modelName: mockModelName,
        systemEvents: mockSystemEvents,
      })
      expect(agent).toBeDefined()
      expect(agent.name).toBe("Critic Agent")
      expect(agent.description).toBeDefined()
      expect(agent.system).toBeDefined()
      expect(agent.model).toBeDefined()
      expect(agent.tools).toBeInstanceOf(Map)
      expect(agent.tools.size).toBe(4)
      expect(agent.tools.has("web_search")).toBe(true)
      expect(agent.tools.has("read_file")).toBe(true)
      expect(agent.tools.has("codebase_search")).toBe(true)
      expect(agent.tools.has("grep_search")).toBe(true)
    })

    it("should create Critic Agent with correct structure and filtered tools", () => {
      const agent = createCriticAgent({
        allTools: mockTools,
        log: mockLog,
        apiKey: mockApiKey,
        modelName: mockModelName,
        systemEvents: mockSystemEvents,
      })
      expect(agent).toBeDefined()
      expect(agent.name).toBe("Critic Agent")
      expect(agent.description).toBeDefined()
      expect(agent.system).toBeDefined()
      expect(agent.model).toBeDefined()
      const agentToolsMap = agent.tools as Map<string, AnyTool> // Use imported type
      expect(agentToolsMap).toBeInstanceOf(Map)
      const expectedToolNames = [
        "web_search",
        "read_file",
        "codebase_search",
        "grep_search",
      ]
      expect(agentToolsMap.size).toBe(expectedToolNames.length)
      expectedToolNames.forEach(toolName => {
        expect(agentToolsMap.has(toolName)).toBe(true)
        expect(agentToolsMap.get(toolName)?.name).toBe(toolName)
      })
    })

    it("should generate a system prompt for Critic Agent", async () => {
      const agent = createCriticAgent({
        allTools: mockTools,
        log: mockLog,
        apiKey: mockApiKey,
        modelName: mockModelName,
        systemEvents: mockSystemEvents,
      })
      // Define the expected state type
      const mockState: Partial<TddNetworkState> = {
        status: NetworkStatus.Enum.NEEDS_TEST_CRITIQUE, // Use imported enum
      }
      const mockCtx = {
        network: {
          state: {
            kv: {
              get: vi
                .fn<(key: string) => Partial<TddNetworkState> | undefined>()
                .mockReturnValue(mockState),
              set: vi.fn(),
            },
          },
        },
      }
      let systemPrompt = ""
      if (typeof agent.system === "function") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        systemPrompt = await agent.system(mockCtx as any)
      } else if (typeof agent.system === "string") {
        systemPrompt = agent.system
      }
      expect(systemPrompt).toBeDefined()
      expect(typeof systemPrompt).toBe("string")
      expect(systemPrompt).toContain("Агент-Критик")
      expect(mockCtx.network?.state.kv.get).toHaveBeenCalledWith(
        "network_state"
      )
    })

    // TODO: Add tests for system prompt generation based on state
    // TODO: Add simplified tests for CriticAgent_onFinish (logging only)
  })
}
