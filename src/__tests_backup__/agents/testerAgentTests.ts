import { describe, it, expect, vi, beforeEach } from "vitest"

import {
  // mockLog, // Removed unused import
  // mockApiKey, // Removed unused import
  // mockModelName, // Removed unused import
  // mockSystemEvents, // Removed unused import
  // mockTools, // Removed unused import
  // mockAgentDeps, // Import if needed directly
  setupTestEnvironment, // Import setup function
  type _AgentDependencies, // Keep alias for AgentDependencies
  // deepseek, // Removed from re-export
} from "./testSetup"

import type {} from // AvailableAgent, // Removed unused import
"@/types/agents" // Correct path for types

import { createTesterAgent } from "@/agents/tester/logic/createTesterAgent"
// import { deepseek } from "@inngest/ai/models" // Removed unused import
import type { HandlerLogger } from "@/types/agents" // Keep this one
import type { Tool } from "@inngest/agent-kit" // Use Tool directly
import { EventEmitter } from "events"

// Mock logger
const mockLogger: HandlerLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
  log: vi.fn(),
}

// Mock dependencies
const baseDependencies: Omit<_AgentDependencies, "instructions"> = {
  apiKey: "test-key",
  modelName: "test-model",
  log: mockLogger,
  allTools: [] as Tool<any>[], // Use Tool[]
  systemEvents: new EventEmitter(),
  eventId: "mock-event-id",
  sandbox: null,
}

// Call setup before each test in this file
beforeEach(() => {
  setupTestEnvironment() // Use the imported setup function
})

export function runTesterAgentTests() {
  // --- Tests for createTesterAgent ---
  describe("createTesterAgent", () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it("should create an agent with the correct name and description", () => {
      const agent = createTesterAgent({
        ...baseDependencies,
        instructions: "mock tester instructions",
      })
      expect(agent.name).toBe("Tester Agent")
      expect(agent.description).toContain("Создает или выполняет команды")
    })

    it("should use the provided model configuration", () => {
      const agent = createTesterAgent({
        ...baseDependencies,
        instructions: "mock tester instructions",
      })
      // Access config through model.options?
      expect(agent.model?.options?.apiKey).toBe("test-key")
      expect(agent.model?.options?.model).toBe("test-model")
    })

    it("should filter tools correctly (Tester needs runCommand, readFile, updateTaskState)", () => {
      // Define mock tools based on the expected structure (name, description, fn)
      const mockRunCommandTool: Tool<any> = {
        name: "runCommand",
        description: "Runs a command",
        handler: vi.fn(),
      }
      const mockReadFileTool: Tool<any> = {
        name: "readFile",
        description: "Reads a file",
        handler: vi.fn(),
      }
      const mockWebSearchTool: Tool<any> = {
        name: "web_search",
        description: "Searches web",
        handler: vi.fn(),
      }
      const depsWithTools = {
        ...baseDependencies,
        allTools: [mockRunCommandTool, mockReadFileTool, mockWebSearchTool],
      }
      const agent = createTesterAgent({
        ...depsWithTools,
        instructions: "mock tester instructions",
      })
      // Agent tools are a Map, use .has()
      expect(agent.tools.has("runCommand")).toBe(true)
      expect(agent.tools.has("readFile")).toBe(true)
      expect(agent.tools.has("web_search")).toBe(false) // Tester doesn't need web_search
    })

    it("should create a tester agent with correct instructions", () => {
      // Mock individual tools (use Tool<any>)
      const mockRunCommandTool: Tool<any> = {
        name: "runCommand",
        description: "Run command",
        handler: vi.fn(),
      }

      const mockReadFileTool: Tool<any> = {
        name: "readFile",
        description: "Read file",
        handler: vi.fn(),
      }

      const mockWebSearchTool: Tool<any> = {
        name: "web_search",
        description: "Web search",
        handler: vi.fn(),
      }

      const depsWithTools = {
        ...baseDependencies,
        allTools: [mockRunCommandTool, mockReadFileTool, mockWebSearchTool],
        logger: mockLogger,
      }

      const agent = createTesterAgent({
        ...depsWithTools,
        instructions: "mock tester instructions",
      })

      expect(agent.name).toBe("Tester Agent")
      expect(agent.description).toContain("Создает или выполняет команды")
      expect(agent.model?.options?.apiKey).toBe("test-key")
      expect(agent.model?.options?.model).toBe("test-model")
      expect(agent.tools.has("runCommand")).toBe(true)
      expect(agent.tools.has("readFile")).toBe(true)
      expect(agent.tools.has("web_search")).toBe(false)
    })
  })
}
