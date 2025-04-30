// src/tools/definitions/__tests__/updateTaskStateTool.test.ts
import { describe, it, expect, beforeEach } from "bun:test"
import { createUpdateTaskStateTool } from "@/tools/definitions/updateTaskStateTool"
import { NetworkStatus, type TddNetworkState } from "@/types/network"
import type { HandlerLogger } from "@/types/agents"
import { type State } from "@inngest/agent-kit"

// Import necessary items from the focused setup file
import {
  // Remove specific mock imports
  // mockInfo,
  // mockWarn,
  // mockError,
  // mockDebug,
  // mockLog,
  mockEventId,
  mockKv,
  mockLogger, // Import the whole logger object
  setupTestEnvironmentFocused, // Import the setup function
} from "../setup/testSetupFocused" // Corrected path

// Remove local mock KV and state
// let mockKvStore = new Map<string, any>()
// let initialState: TddNetworkState | undefined

// const mockKv = { ... } // Remove local mockKv definition

// Mock ToolInput structure (if ToolInput is needed)
// This is a basic structure, adjust based on actual ToolInput type from agent-kit
type MockToolInput<P = any, S extends Record<string, unknown> = any> = {
  params: P
  network: {
    state: State<S>
    agent: { id: string }
  }
}

// Helper to create mock ToolInput
const createMockToolInput = <P, S extends Record<string, unknown>>(
  params: P,
  // stateData: S, // State data is now managed via imported mockKv
  agentId = "mockAgent"
): MockToolInput<P, S> => {
  return {
    params,
    network: {
      state: { kv: mockKv } as any, // Use imported mockKv
      agent: { id: agentId },
    },
  }
}

// Remove local logger redefinition
// const testLogger = { ... }

describe("createUpdateTaskStateTool", () => {
  const eventId = mockEventId

  beforeEach(() => {
    // Use the setup function from the focused setup file
    setupTestEnvironmentFocused()
  })

  it("should create a tool with the correct name and description", () => {
    // Use the imported mockLogger
    const tool = createUpdateTaskStateTool(mockLogger as HandlerLogger, eventId)
    expect(tool.name).toBe("update_task_state")
    expect(tool.description).toContain("Updates the current state")
  })

  it("should update the status in the KV store", async () => {
    // Use the imported mockLogger
    const tool = createUpdateTaskStateTool(mockLogger as HandlerLogger, eventId)
    const startState: TddNetworkState = {
      status: NetworkStatus.Enum.NEEDS_REQUIREMENTS_CRITIQUE,
      task: "initial task",
      sandboxId: "sandbox-1",
      run_id: "run-1", // Added run_id
    }
    // Use mockKv.set directly to initialize state for the test
    mockKv.set("network_state", startState)

    const params = { newStatus: NetworkStatus.Enum.NEEDS_TEST }
    const mockOpts = createMockToolInput(params)
    const expectedEndState: TddNetworkState = {
      ...startState,
      status: NetworkStatus.Enum.NEEDS_TEST,
    }

    await tool.handler(params, mockOpts as any)

    // Use .mock.calls to access mock calls in bun:test
    // console.log("--- Test 1 KV Set Args ---")
    // console.log("Actual:", JSON.stringify(mockKv.set.mock.calls[0], null, 2))
    // console.log("Expected Key:", "network_state")
    // console.log("Expected State:", JSON.stringify(expectedEndState, null, 2))
    // console.log("---------------------------")

    expect(mockKv.set).toHaveBeenCalledTimes(2) // Once for setup, once by the handler
    expect(mockKv.set).toHaveBeenNthCalledWith(
      2,
      "network_state",
      expectedEndState
    )

    // Check the state via the mockKv.get
    const finalState = mockKv.get("network_state")
    expect(finalState).toEqual(expectedEndState)

    // console.log("--- Test 1 Logger Info Args ---")
    // Use .mock.calls instead of .calls
    // console.log("Actual:", JSON.stringify(mockLogger.info.mock.calls, null, 2)) // Log all calls
    // console.log("------------------------------")

    // Check that the SUCCESS log message was called
    // Use mockLogger.info
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.objectContaining({ step: "TOOL_UPDATE_STATE_SUCCESS" }),
      expect.stringContaining("Network state updated successfully"),
      expect.anything()
    )
    // Optional: Check for START log if needed
    // Use mockLogger.info
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.objectContaining({ step: "TOOL_UPDATE_STATE_START" }),
      expect.stringContaining("Attempting to update network state"),
      expect.anything()
    )
  })

  it("should update status and other provided fields, respecting tool logic", async () => {
    // Use the imported mockLogger
    const tool = createUpdateTaskStateTool(mockLogger as HandlerLogger, eventId)
    const startState: TddNetworkState = {
      task: "task two",
      status: NetworkStatus.Enum.NEEDS_TEST,
      sandboxId: "sandbox-2",
      test_requirements: "Initial requirements",
      run_id: "run-2", // Added run_id
    }
    mockKv.set("network_state", startState)

    const params = {
      newStatus: NetworkStatus.Enum.NEEDS_TEST_CRITIQUE,
      test_requirements: "Updated requirements",
      critique: "Needs more detail",
    }
    const mockOpts = createMockToolInput(params)
    const expectedEndState: TddNetworkState = {
      ...startState,
      status: NetworkStatus.Enum.NEEDS_TEST_CRITIQUE,
      // test_requirements: undefined, // This line was incorrect, the tool logic keeps it if provided
      test_requirements: "Updated requirements", // Tool logic should keep this
      implementation_critique: "Needs more detail",
    }

    await tool.handler(params, mockOpts as any)

    // console.log("--- Test 2 KV Set Args ---")
    // console.log("Actual:", JSON.stringify(mockKv.set.mock.calls[0], null, 2))
    // console.log("Expected Key:", "network_state")
    // console.log("Expected State:", JSON.stringify(expectedEndState, null, 2))
    // console.log("---------------------------")

    expect(mockKv.set).toHaveBeenCalledTimes(2)
    expect(mockKv.set).toHaveBeenNthCalledWith(
      2,
      "network_state",
      expectedEndState // Adjusted expectation based on assumed tool logic
    )

    const finalState = mockKv.get("network_state")
    expect(finalState).toEqual(expectedEndState)

    // console.log("--- Test 2 Logger Info Args ---")
    // Use .mock.calls instead of .calls
    // console.log("Actual:", JSON.stringify(mockLogger.info.mock.calls, null, 2)) // Log all calls
    // console.log("------------------------------")

    // Check that the SUCCESS log message was called
    // Use mockLogger.info
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.objectContaining({ step: "TOOL_UPDATE_STATE_SUCCESS" }),
      expect.stringContaining("Network state updated successfully"),
      expect.anything()
    )
    // Optional: Check for START log if needed
    // Use mockLogger.info
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.objectContaining({ step: "TOOL_UPDATE_STATE_START" }),
      expect.stringContaining("Attempting to update network state"),
      expect.anything()
    )
  })

  it("should handle missing initial state defensively", async () => {
    // Use the imported mockLogger
    const tool = createUpdateTaskStateTool(mockLogger as HandlerLogger, eventId)
    const params = {
      newStatus: NetworkStatus.Enum.NEEDS_IMPLEMENTATION_REVISION,
    }
    const mockOpts = createMockToolInput(params)
    const expectedEndState: Partial<TddNetworkState> = {
      task: "unknown - state missing before update",
      status: NetworkStatus.Enum.NEEDS_IMPLEMENTATION_REVISION,
      sandboxId: undefined,
    }

    // Ensure state is missing before handler call
    mockKv.delete("network_state") // Use mockKv directly

    await tool.handler(params, mockOpts as any)

    // console.log("--- Test 3 KV Set Args ---")
    // console.log("Actual:", JSON.stringify(mockKv.set.mock.calls[0], null, 2))
    // console.log("Expected Key:", "network_state")
    // console.log("Expected State:", JSON.stringify(expectedEndState, null, 2))
    // console.log("---------------------------")

    expect(mockKv.set).toHaveBeenCalledTimes(1) // Only called by the handler
    expect(mockKv.set).toHaveBeenCalledWith(
      "network_state",
      expect.objectContaining(expectedEndState)
    )

    // console.log("--- Test 3 Logger Warn Args ---")
    // Use .mock.calls instead of .calls
    // console.log("Actual:", JSON.stringify(mockLogger.warn.mock.calls, null, 2)) // Log all calls
    // console.log("------------------------------")

    // Use mockLogger.warn
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ step: "TOOL_UPDATE_STATE_WARN" }),
      expect.stringContaining("Initial state not found"),
      expect.anything()
    )
  })

  it("should log an error if KV store update fails", async () => {
    // Use the imported mockLogger
    const tool = createUpdateTaskStateTool(mockLogger as HandlerLogger, eventId)
    const startState: TddNetworkState = {
      status: NetworkStatus.Enum.COMPLETED,
      task: "error test",
      sandboxId: "sandbox-error",
      run_id: "run-error", // Added run_id
    }
    mockKv.set("network_state", startState) // Use mockKv directly

    // Simulate KV set failure
    const setError = new Error("KV store unavailable")
    mockKv.set.mockImplementationOnce(() => {
      // First call (setup) works
      mockKv.set.mockImplementation(() => {
        // Second call (handler) fails
        throw setError
      })
    })

    const params = { newStatus: NetworkStatus.Enum.FAILED }
    const mockOpts = createMockToolInput(params)

    await expect(tool.handler(params, mockOpts as any)).rejects.toThrow(
      "KV store unavailable"
    )

    // console.log("--- Test 4 Logger Error Args ---")
    // Use .mock.calls instead of .calls
    // console.log("Actual:", JSON.stringify(mockLogger.error.mock.calls, null, 2)) // Log all calls
    // console.log("------------------------------")

    // Use mockLogger.error
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({ step: "TOOL_UPDATE_STATE_ERROR" }),
      expect.stringContaining("Failed to update network state"),
      setError
    )
  })

  it("should selectively update fields based on tool logic", async () => {
    const tool = createUpdateTaskStateTool(mockLogger as HandlerLogger, eventId)
    const startState: TddNetworkState = {
      task: "selective update",
      status: NetworkStatus.Enum.NEEDS_CODE,
      sandboxId: "sandbox-selective",
      run_id: "run-selective",
      test_code: "old test code",
      implementation_code: "old implementation code",
    }
    mockKv.set("network_state", startState)

    const params = {
      newStatus: NetworkStatus.Enum.NEEDS_TYPE_CHECK,
      implementation_code: "new implementation code", // Only this should be updated
      test_code: "should be ignored", // Tool logic might ignore this if status is not related to tests
    }
    const mockOpts = createMockToolInput(params)

    // Expected state depends heavily on the *actual* logic inside createUpdateTaskStateTool
    // Assuming it updates status and only fields relevant to that status transition:
    const expectedEndState: TddNetworkState = {
      ...startState,
      status: NetworkStatus.Enum.NEEDS_TYPE_CHECK,
      implementation_code: "new implementation code", // Updated
      test_code: "old test code", // Assumed to be unchanged by the tool for this status transition
    }

    await tool.handler(params, mockOpts as any)

    expect(mockKv.set).toHaveBeenCalledTimes(2)
    expect(mockKv.set).toHaveBeenNthCalledWith(
      2,
      "network_state",
      expectedEndState // Verify against the expected state based on tool logic
    )

    const finalState = mockKv.get("network_state")
    expect(finalState).toEqual(expectedEndState)

    // Check logger calls if necessary
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.objectContaining({ step: "TOOL_UPDATE_STATE_SUCCESS" }),
      expect.stringContaining("Network state updated successfully"),
      expect.anything()
    )
  })

  // Add more tests for edge cases, specific field updates, etc.
})
