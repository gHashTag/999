// src/tools/definitions/__tests__/updateTaskStateTool.test.ts
import { describe, it, expect, beforeEach } from "bun:test"
import { createUpdateTaskStateTool } from "@/tools/definitions/updateTaskStateTool"
import { NetworkStatus, type TddNetworkState } from "@/types/network"
import type { HandlerLogger } from "@/types/agents"
import { type State } from "@inngest/agent-kit"

// Import necessary items from the focused setup file
import {
  mockInfo,
  mockWarn,
  mockError,
  mockDebug,
  mockLog,
  mockEventId,
  mockKv, // Import mockKv
} from "../testSetup" // Corrected path

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

// Reconstruct a logger-like object locally using imported mocks
const testLogger = {
  info: mockInfo,
  warn: mockWarn,
  error: mockError,
  debug: mockDebug,
  log: mockLog,
}

describe("createUpdateTaskStateTool", () => {
  const eventId = mockEventId

  beforeEach(() => {
    // Reset imported mockKv store and mocks before each test
    const kvStore = new Map<string, any>() // Use a local map for this test suite's state

    mockKv.get.mockClear()
    mockKv.set.mockClear()
    mockKv.all.mockClear()
    mockKv.delete.mockClear()
    mockKv.has.mockClear()

    // Set mock implementations pointing to the local kvStore for this suite
    mockKv.get.mockImplementation(
      (key: string): TddNetworkState | undefined => {
        const state = kvStore.get(key)
        return state ? { ...state } : undefined
      }
    )
    mockKv.set.mockImplementation((key: string, value: any) => {
      kvStore.set(key, value)
      // Log calls for debugging within tests if needed
      // console.log(`-- MOCK KV SET [${key}] --`, JSON.stringify(value));
    })
    mockKv.all.mockImplementation(() => Object.fromEntries(kvStore))
    mockKv.delete.mockImplementation((key: string) => kvStore.delete(key))
    mockKv.has.mockImplementation((key: string) => kvStore.has(key))

    // Reset Logger mocks directly
    mockInfo.mockClear()
    mockWarn.mockClear()
    mockError.mockClear()
    mockDebug.mockClear()
    mockLog.mockClear()
  })

  it("should create a tool with the correct name and description", () => {
    const tool = createUpdateTaskStateTool(testLogger as HandlerLogger, eventId)
    expect(tool.name).toBe("update_task_state")
    expect(tool.description).toContain("Updates the current state")
  })

  it("should update the status in the KV store", async () => {
    const tool = createUpdateTaskStateTool(testLogger as HandlerLogger, eventId)
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
    console.log("--- Test 1 KV Set Args ---")
    console.log("Actual:", JSON.stringify(mockKv.set.mock.calls[0], null, 2))
    console.log("Expected Key:", "network_state")
    console.log("Expected State:", JSON.stringify(expectedEndState, null, 2))
    console.log("---------------------------")

    expect(mockKv.set).toHaveBeenCalledTimes(2) // Once for setup, once by the handler
    expect(mockKv.set).toHaveBeenNthCalledWith(
      2,
      "network_state",
      expectedEndState
    )

    // Check the state via the mockKv.get
    const finalState = mockKv.get("network_state")
    expect(finalState).toEqual(expectedEndState)

    console.log("--- Test 1 Logger Info Args ---")
    // Use .mock.calls instead of .calls
    console.log("Actual:", JSON.stringify(mockInfo.mock.calls, null, 2)) // Log all calls
    console.log("------------------------------")

    // Check that the SUCCESS log message was called
    expect(mockInfo).toHaveBeenCalledWith(
      expect.objectContaining({ step: "TOOL_UPDATE_STATE_SUCCESS" }),
      expect.stringContaining("Network state updated successfully"),
      expect.anything()
    )
    // Optional: Check for START log if needed
    expect(mockInfo).toHaveBeenCalledWith(
      expect.objectContaining({ step: "TOOL_UPDATE_STATE_START" }),
      expect.stringContaining("Attempting to update network state"),
      expect.anything()
    )
  })

  it("should update status and other provided fields, respecting tool logic", async () => {
    const tool = createUpdateTaskStateTool(testLogger as HandlerLogger, eventId)
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
      test_requirements: undefined,
      implementation_critique: "Needs more detail",
    }

    await tool.handler(params, mockOpts as any)

    console.log("--- Test 2 KV Set Args ---")
    console.log("Actual:", JSON.stringify(mockKv.set.mock.calls[0], null, 2))
    console.log("Expected Key:", "network_state")
    console.log("Expected State:", JSON.stringify(expectedEndState, null, 2))
    console.log("---------------------------")

    expect(mockKv.set).toHaveBeenCalledTimes(2)
    expect(mockKv.set).toHaveBeenNthCalledWith(
      2,
      "network_state",
      expectedEndState
    )

    const finalState = mockKv.get("network_state")
    expect(finalState).toEqual(expectedEndState)

    console.log("--- Test 2 Logger Info Args ---")
    // Use .mock.calls instead of .calls
    console.log("Actual:", JSON.stringify(mockInfo.mock.calls, null, 2)) // Log all calls
    console.log("------------------------------")

    // Check that the SUCCESS log message was called
    expect(mockInfo).toHaveBeenCalledWith(
      expect.objectContaining({ step: "TOOL_UPDATE_STATE_SUCCESS" }),
      expect.stringContaining("Network state updated successfully"),
      expect.anything()
    )
    // Optional: Check for START log if needed
    expect(mockInfo).toHaveBeenCalledWith(
      expect.objectContaining({ step: "TOOL_UPDATE_STATE_START" }),
      expect.stringContaining("Attempting to update network state"),
      expect.anything()
    )
  })

  it("should handle missing initial state defensively", async () => {
    const tool = createUpdateTaskStateTool(testLogger as HandlerLogger, eventId)
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
    mockKv.delete("network_state")

    await tool.handler(params, mockOpts as any)

    console.log("--- Test 3 KV Set Args ---")
    console.log("Actual:", JSON.stringify(mockKv.set.mock.calls[0], null, 2))
    console.log("Expected Key:", "network_state")
    console.log("Expected State:", JSON.stringify(expectedEndState, null, 2))
    console.log("---------------------------")

    expect(mockKv.set).toHaveBeenCalledTimes(1) // Only called by the handler
    expect(mockKv.set).toHaveBeenCalledWith(
      "network_state",
      expect.objectContaining(expectedEndState)
    )

    console.log("--- Test 3 Logger Warn Args ---")
    // Use .mock.calls instead of .calls
    console.log("Actual:", JSON.stringify(mockWarn.mock.calls[0], null, 2))
    console.log("------------------------------")

    expect(mockWarn).toHaveBeenCalledWith(
      expect.objectContaining({ step: "TOOL_UPDATE_STATE_WARN" }),
      expect.stringContaining("Initial state was missing in KV store"),
      expect.anything()
    )
  })

  it("should throw error if KV store is not available in opts", async () => {
    const tool = createUpdateTaskStateTool(testLogger as HandlerLogger, eventId)
    const params = { newStatus: NetworkStatus.Enum.NEEDS_CODE }
    // Create opts without state.kv
    const mockOpts = {
      params,
      network: {
        // state: { kv: undefined } as any, // This won't work, need to omit state entirely or make kv null
        agent: { id: "mockAgent" },
      },
    }

    await expect(tool.handler(params, mockOpts as any)).rejects.toThrow(
      "Network state KV store is not available"
    )

    console.log("--- Test 4 Logger Error Args ---")
    // Use .mock.calls instead of .calls
    console.log("Actual:", JSON.stringify(mockError.mock.calls[0], null, 2))
    console.log("-------------------------------")

    expect(mockError).toHaveBeenCalledWith(
      expect.objectContaining({ step: "TOOL_UPDATE_STATE_ERROR" }),
      "Network state KV store is not available in updateTaskState tool.",
      expect.objectContaining({ eventId: mockEventId })
    )
  })
})
