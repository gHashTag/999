import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  createTesterAgent,
  createCodingAgent,
  createCriticAgent,
  // Assuming the actual hook functions are exported for testing purposes
  TesterAgent_onFinish, // We might need this if testing hooks directly
} from "../src/agentDefinitions.js" // Corrected path
import { NetworkStatus } from "../src/types.js" // Only NetworkStatus needed
// Import ToolSchema from the correct path
import type { ToolSchema } from "../src/types.js"
import { deepseek } from "@inngest/ai/models" // Mock this later if needed
// Removed GetStepTools and EventPayload imports as they are no longer used directly in tests
// import type { EventPayload, GetStepTools } from "inngest"
// Import types from agent-kit, assuming ToolCallResultMessage exists
import type { AgentResult, ToolCallResultMessage } from "@inngest/agent-kit"

// --- Mock Dependencies ---
// Define the logger type
type LoggerFunc = (
  level: "info" | "warn" | "error",
  stepName: string,
  message: string,
  data?: object
) => void

// Mock logger with correct type signature for vi.fn
const mockLog = vi.fn<
  [
    level: "info" | "warn" | "error",
    stepName: string,
    message: string,
    data?: object | undefined,
  ],
  void
>()
const mockApiKey = "test-api-key"
const mockModelName = "test-model"

// Corrected mockTools as an array
const mockTools: ToolSchema[] = [
  {
    name: "createOrUpdateFiles",
    description: "mock",
    parameters: {},
    handler: vi.fn(),
  },
  {
    name: "terminal",
    description: "mock",
    parameters: {},
    handler: vi.fn(),
  },
]

// Mock deepseek
vi.mock("@inngest/ai/models", () => ({
  deepseek: vi.fn().mockReturnValue({ client: { api: "deepseek" } } as any),
}))

describe("Agent Definitions", () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks()
    mockLog.mockClear()
    vi.mocked(deepseek).mockReturnValue({ client: { api: "deepseek" } } as any)
  })

  // --- Tests for createTesterAgent ---
  describe("createTesterAgent", () => {
    it("should create a Tester Agent with correct basic properties", () => {
      const agent = createTesterAgent({
        allTools: mockTools,
        log: mockLog,
        apiKey: mockApiKey,
        modelName: mockModelName,
      })

      expect(agent).toBeDefined()
      expect(agent.name).toBe("Tester Agent")
      expect(agent.description).toBeDefined()
      expect(agent.system).toBeDefined()
      // Check tool presence indirectly - createAgent converts array to Map internally
      expect(agent.tools).toBeInstanceOf(Map) // Check if it's a Map
      expect(agent.tools.size).toBe(mockTools.length) // Check size
      mockTools.forEach(tool => {
        expect(agent.tools.has(tool.name)).toBe(true) // Check if tool names exist in the Map
      })
      expect(agent.model).toBeDefined()
      expect(vi.mocked(deepseek)).toHaveBeenCalledWith({
        apiKey: mockApiKey,
        model: mockModelName,
      })
    })

    describe("onFinish Hook (Simplified)", () => {
      it("should log success when test.js is created successfully", async () => {
        // Arrange
        const mockTestContent =
          "const assert = require('assert'); assert.ok(true);"
        // Mock AgentResult structure correctly (output is Message[])
        const mockResult: AgentResult = {
          agentName: "Tester Agent",
          createdAt: new Date(),
          export: () => ({}), // Mock export function
          checksum: "mock_checksum",
          toolCalls: [
            {
              toolName: "createOrUpdateFiles",
              args: {},
              // Assuming 'output' on ToolCallResultMessage holds the tool's return value
              output: {
                success: true,
                files: [{ name: "test.js", content: mockTestContent }],
              } as ToolCallResultMessage, // Use type assertion if type is complex/unavailable
            } as unknown as ToolCallResultMessage, // Use type assertion if type is complex/unavailable
          ],
          output: [{ role: "assistant", content: "Created test.js" }], // Example Message[]
        }

        // Act
        const returnedResult = await TesterAgent_onFinish({
          result: mockResult,
          log: mockLog,
        })

        // Assert returned result is the same as input
        expect(returnedResult).toBe(mockResult)

        // Assert Logs: Check for success message and final success log
        expect(mockLog).toHaveBeenCalledWith(
          "info",
          "[TesterAgent_onFinish]",
          expect.stringContaining("Successfully extracted 'test.js' content"),
          expect.any(Object)
        )
        expect(mockLog).toHaveBeenCalledWith(
          "info",
          "[TesterAgent_onFinish]",
          "Hook finished successfully. Test file processed.",
          {}
        )
        // Ensure no error logs were called
        expect(mockLog).not.toHaveBeenCalledWith(
          "error",
          expect.anything(),
          expect.anything(),
          expect.anything()
        )
      })

      it("should log warning if test.js is NOT found in successful tool result", async () => {
        // Arrange
        const mockResult: AgentResult = {
          agentName: "Tester Agent",
          createdAt: new Date(),
          export: () => ({}),
          checksum: "mock_checksum",
          output: [],
          toolCalls: [
            {
              toolName: "createOrUpdateFiles",
              args: {},
              output: {
                success: true,
                files: [{ name: "otherfile.txt", content: "abc" }],
              } as ToolCallResultMessage,
            } as unknown as ToolCallResultMessage,
          ],
        }

        // Act
        await TesterAgent_onFinish({
          result: mockResult,
          log: mockLog,
        })

        // Assert Logs: Check for the specific warning log and the final warning log
        expect(mockLog).toHaveBeenCalledWith(
          "warn",
          "[TesterAgent_onFinish]",
          expect.stringContaining("File 'test.js' not found"),
          expect.any(Object)
        )
        expect(mockLog).toHaveBeenCalledWith(
          "warn",
          "[TesterAgent_onFinish]",
          "Hook finished. Test file not processed correctly.",
          expect.objectContaining({ testFileExtracted: false })
        )
        // Ensure the final log wasn't success or error
        expect(mockLog).not.toHaveBeenCalledWith(
          "info",
          expect.stringContaining("Hook finished successfully")
        )
        expect(mockLog).not.toHaveBeenCalledWith(
          "error",
          expect.stringContaining("Hook finished with error")
        )
      })

      it("should log error if createOrUpdateFiles tool fails", async () => {
        // Arrange
        const mockResult: AgentResult = {
          agentName: "Tester Agent",
          createdAt: new Date(),
          export: () => ({}),
          checksum: "mock_checksum",
          output: [],
          toolCalls: [
            {
              toolName: "createOrUpdateFiles",
              args: {},
              output: {
                success: false,
                files: [],
                error: "Disk full",
              } as ToolCallResultMessage,
            } as unknown as ToolCallResultMessage,
          ],
        }

        // Act
        await TesterAgent_onFinish({
          result: mockResult,
          log: mockLog,
        })

        // Assert Logs: Check for tool failure log and final warning log
        expect(mockLog).toHaveBeenCalledWith(
          "warn",
          "[TesterAgent_onFinish]",
          expect.stringContaining(
            "Tool 'createOrUpdateFiles' failed or returned undefined output."
          ),
          expect.any(Object)
        )
        expect(mockLog).toHaveBeenCalledWith(
          "warn",
          "[TesterAgent_onFinish]",
          "Hook finished. Test file not processed correctly.",
          expect.objectContaining({ testFileExtracted: false })
        )
        expect(mockLog).not.toHaveBeenCalledWith(
          "info",
          expect.stringContaining("Hook finished successfully")
        )
      })

      it("should log error if agent result indicates an error", async () => {
        // Arrange
        const agentErrorMessage = "Agent processing failed"
        // Mock AgentResult with an error property (adjust based on actual AgentResult structure if known)
        const mockResultWithError = {
          agentName: "Tester Agent",
          createdAt: new Date(),
          export: () => ({}),
          checksum: "mock_checksum",
          output: [],
          toolCalls: [],
          error: new Error(agentErrorMessage), // Still using tentative error property
        } as unknown as AgentResult // Use unknown cast if structure is uncertain

        // Act
        await TesterAgent_onFinish({
          result: mockResultWithError,
          log: mockLog,
        })

        // Assert Logs: Check for agent error log and final error log
        expect(mockLog).toHaveBeenCalledWith(
          "error",
          "[TesterAgent_onFinish]",
          expect.stringContaining("TesterAgent encountered an agent error."),
          expect.objectContaining({ agentError: agentErrorMessage })
        )
        expect(mockLog).toHaveBeenCalledWith(
          "error",
          "[TesterAgent_onFinish]",
          "Hook finished due to agent error.",
          expect.objectContaining({ error: agentErrorMessage })
        )
        expect(mockLog).not.toHaveBeenCalledWith(
          "info",
          expect.stringContaining("Hook finished successfully")
        )
      })

      it("should log warning if tool was not called or result unexpected", async () => {
        // Arrange
        const mockResultNoToolCall: AgentResult = {
          agentName: "Tester Agent",
          createdAt: new Date(),
          export: () => ({}),
          checksum: "mock_checksum",
          toolCalls: [], // No tool call
          output: [{ role: "assistant", content: "I couldn't call the tool." }],
        }

        // Act
        await TesterAgent_onFinish({
          result: mockResultNoToolCall,
          log: mockLog,
        })

        // Assert Logs: Check for the specific warning and the final warning
        expect(mockLog).toHaveBeenCalledWith(
          "warn",
          "[TesterAgent_onFinish]",
          expect.stringContaining("Tool 'createOrUpdateFiles' was not called."),
          expect.any(Object)
        )
        expect(mockLog).toHaveBeenCalledWith(
          "warn",
          "[TesterAgent_onFinish]",
          "Hook finished. Test file not processed correctly.",
          expect.objectContaining({ testFileExtracted: false })
        )
        expect(mockLog).not.toHaveBeenCalledWith(
          "info",
          expect.stringContaining("Hook finished successfully")
        )
        expect(mockLog).not.toHaveBeenCalledWith(
          "error",
          expect.stringContaining("Hook finished with error")
        )
      })
    })
  })

  // --- Tests for createCodingAgent ---
  describe("createCodingAgent", () => {
    it("should create a Coding Agent with correct basic properties", () => {
      const agent = createCodingAgent({
        allTools: mockTools,
        log: mockLog,
        apiKey: mockApiKey,
        modelName: mockModelName,
      })
      expect(agent).toBeDefined()
      expect(agent.name).toBe("Coding Agent")
      // Check tool presence indirectly
      expect(agent.tools).toBeInstanceOf(Map)
      expect(agent.tools.size).toBe(mockTools.length)
      mockTools.forEach(tool => {
        expect(agent.tools.has(tool.name)).toBe(true)
      })
      // ... other basic checks similar to Tester Agent ...
    })

    // TODO: Add simplified tests for CodingAgent_onFinish (logging only)
  })

  // --- Tests for createCriticAgent ---
  describe("createCriticAgent", () => {
    it("should create a Critic Agent with correct basic properties", () => {
      const agent = createCriticAgent({
        allTools: mockTools,
        log: mockLog,
        apiKey: mockApiKey,
        modelName: mockModelName,
      })
      expect(agent).toBeDefined()
      expect(agent.name).toBe("Critic Agent")
      // Check that tools are filtered correctly (indirectly)
      const expectedFilteredToolNames = mockTools
        .filter(t => t.name !== "processArtifact")
        .map(t => t.name)
      expect(agent.tools).toBeInstanceOf(Map)
      expect(agent.tools.size).toBe(expectedFilteredToolNames.length)
      expectedFilteredToolNames.forEach(name => {
        expect(agent.tools.has(name)).toBe(true)
      })
      // ... other basic checks ...
    })

    // TODO: Add tests for system prompt generation based on state
    // TODO: Add simplified tests for CriticAgent_onFinish (logging only)
  })
})
