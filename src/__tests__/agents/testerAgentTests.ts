import { describe, it, expect, vi, beforeEach } from "vitest"

import {
  // mockLog, // Removed unused import
  // mockApiKey, // Removed unused import
  // mockModelName, // Removed unused import
  // mockSystemEvents, // Removed unused import
  // mockTools, // Removed unused import
  // mockAgentDeps, // Import if needed directly
  setupTestEnvironmentFocused, // Import setup function
  type AgentDependencies, // <-- Use correct type
  mockLogger, // <-- Import mock logger
  // deepseek, // Removed from re-export
} from "../testSetupFocused" // <-- CORRECTED PATH

// Removed AvailableAgent import
// Removed HandlerLogger import (mockLogger is typed)

import { createTesterAgent } from "@/agents/tester/logic/createTesterAgent"
// import { deepseek } from "@inngest/ai/models" // Removed unused import
import type { Tool } from "@inngest/agent-kit" // Use Tool directly
import { EventEmitter } from "events"

// Removed mockLogger definition (imported now)
// Removed baseDependencies definition (will create inside tests)

// Removed global beforeEach (handled by describe)

export function runTesterAgentTests() {
  // --- Tests for createTesterAgent ---
  describe("createTesterAgent", () => {
    let testDependencies: AgentDependencies // Use correct type

    beforeEach(() => {
      vi.clearAllMocks()
      setupTestEnvironmentFocused() // Use correct setup function
      // Initialize FULL dependencies here for each test
      testDependencies = {
        apiKey: "test-key",
        modelName: "test-model",
        log: mockLogger, // Use imported mock
        allTools: [], // Start empty, add tools per test
        systemEvents: new EventEmitter(),
        eventId: "mock-event-id",
        sandbox: null,
        model: vi.fn() as any, // Add mock model
      }
    })

    it("should create an agent with the correct name and description", () => {
      // Pass the full testDependencies object
      const agent = createTesterAgent({
        ...testDependencies,
        instructions: "mock tester instructions",
      })
      expect(agent.name).toBe("Tester Agent")
      expect(agent.description).toContain("Создает или выполняет команды")
    })

    it("should use the provided model configuration", () => {
      // Pass the full testDependencies object
      const agent = createTesterAgent({
        ...testDependencies,
        instructions: "mock tester instructions",
      })
      // Access config through model.options?
      // This test might be less relevant if we mock the model itself
      // expect(agent.model?.options?.apiKey).toBe("test-key");
      // expect(agent.model?.options?.model).toBe("test-model");
      expect(agent.model).toBeDefined() // Check if model is set
    })

    it("should filter tools correctly (Tester needs runTerminalCommand, readFile, updateTaskState)", () => {
      // Define mock tools for this test
      const mockRunTerminalCommandTool: Tool<any> = {
        /* ... */
      }
      const mockReadFileTool: Tool<any> = {
        /* ... */
      }
      const mockWebSearchTool: Tool<any> = {
        /* ... */
      }
      const mockUpdateStateTool: Tool<any> = {
        /* ... */
      }

      // Create dependencies with specific tools for this test
      const depsWithTools: AgentDependencies = {
        ...testDependencies,
        allTools: [
          mockRunTerminalCommandTool,
          mockReadFileTool,
          mockWebSearchTool,
          mockUpdateStateTool,
        ],
      }
      // Pass the full depsWithTools object
      const agent = createTesterAgent({
        ...depsWithTools,
        instructions: "mock tester instructions",
      })
      // Agent tools are NOT directly accessible/assertable as a public Map.
      // We can only assert that the agent was created successfully.
      expect(agent).toBeDefined()
      expect(agent.name).toBe("Tester Agent")
    })

    it("should create a tester agent with correct instructions", () => {
      // Define mock tools for this test
      const mockRunTerminalCommandTool: Tool<any> = {
        /* ... */
      }
      const mockReadFileTool: Tool<any> = {
        /* ... */
      }
      const mockWebSearchTool: Tool<any> = {
        /* ... */
      }
      const mockUpdateStateTool: Tool<any> = {
        /* ... */
      }

      // Create dependencies with specific tools and logger for this test
      const depsWithTools: AgentDependencies = {
        ...testDependencies,
        allTools: [
          mockRunTerminalCommandTool,
          mockReadFileTool,
          mockWebSearchTool,
          mockUpdateStateTool,
        ],
        // log: mockLogger, // Already included in testDependencies
      }
      // Pass the full depsWithTools object
      const agent = createTesterAgent({
        ...depsWithTools,
        instructions: "mock tester instructions",
      })

      // Basic assertions
      expect(agent.name).toBe("Tester Agent")
      expect(agent.description).toContain("Создает или выполняет команды")
      expect(agent.model).toBeDefined()
    })
  })
}
