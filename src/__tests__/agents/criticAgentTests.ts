import { describe, it, expect, vi, beforeEach } from "vitest"

import {
  mockLog,
  mockApiKey,
  mockModelName,
  mockSystemEvents,
  mockTools,
  setupTestEnvironment,
} from "./testSetup" // Correct path for mocks

import type {
  AgentDependencies,
  // AvailableAgent, // Removed unused import
} from "@/types/agents" // Correct path for types

import { createCriticAgent } from "@/agents" // Use alias
// import { deepseek } from "@inngest/ai/models" // Removed unused import
import { NetworkStatus } from "@/types/network" // Import only NetworkStatus

beforeEach(() => {
  setupTestEnvironment()
})

export function runCriticAgentTests() {
  // --- Tests for createCriticAgent ---
  describe("createCriticAgent", () => {
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

    it("should create a Critic Agent with correct basic properties", () => {
      const agent = createCriticAgent(dependencies)
      expect(agent).toBeDefined()
      expect(agent.name).toBe("Critic Agent")
      expect(agent.description).toBeDefined()
      expect(agent.model).toBeDefined()
    })

    it("should create Critic Agent with correct structure and filtered tools", () => {
      const agent = createCriticAgent(dependencies)
      expect(agent.tools.has("updateTaskState")).toBe(true)
      expect(agent.tools.has("readFile")).toBe(true)
      expect(agent.tools.has("askHumanForInput")).toBe(false)
      expect(agent.tools.has("runCommand")).toBe(false)
    })

    it("should generate a system prompt for Critic Agent", async () => {
      const agent = createCriticAgent(dependencies)
      const mockState: Partial<any> = {
        status: NetworkStatus.Enum.NEEDS_TEST_CRITIQUE,
      }
      const mockCtx = {
        network: {
          state: {
            kv: {
              get: vi
                .fn<(key: string) => Partial<any> | undefined>()
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
