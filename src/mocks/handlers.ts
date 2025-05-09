import { http, HttpResponse } from "msw"
import { log } from "@/utils/logic/logger"
import { NetworkStatus } from "@/types/network"

// Define a basic mock response for the DeepSeek API
// const mockDeepseekResponse = { /* ... */ };

// Example initial state for testing
// const mockInitialState: TddNetworkState = { /* ... */ };

// let runCounter = 0
// let runState: Record<string, any> = {}

export const handlers = [
  // FIX: Removed MSW mocks for Inngest API (/api/inngest, /v1/runs/:runId) for E2E tests
  // --- > Restore mock for POST /api/inngest <---
  http.post("/api/inngest", async ({ request }) => {
    const event = await request.json()
    const eventId = `mock-event-id-${Date.now()}`
    log(
      "info",
      "MSW_INGEST_POST",
      `[MSW] Intercepted POST /api/inngest for event. Returning ID: ${eventId}`,
      { event: JSON.stringify(event) }
    )
    // Return a mock response similar to what Inngest might return
    return HttpResponse.json({
      ids: [eventId], // Essential for the test to grab the event ID
      status: 200, // Or appropriate status code
      message: "Event received (MSW Mock)",
    })
  }),
  // FIX: Mock for GET /v1/runs/:runId remains removed for E2E polling

  // Mock the DeepSeek API endpoint (Keep this one)
  http.post("https://api.deepseek.com/v1/chat/completions", () => {
    log(
      "info",
      "MSW_DEEPSEEK",
      "[MSW] Intercepted DeepSeek API call - Returning TOOL CALL"
    )
    // Return a response that simulates a tool call to updateTaskState
    return HttpResponse.json({
      id: "chatcmpl-mock-tool-call-id",
      object: "chat.completion",
      created: Date.now(),
      model: "deepseek-coder",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: null, // Content can be null when tool calls are present
            tool_calls: [
              {
                id: "mock_tool_call_123", // ID for the tool call
                type: "function",
                function: {
                  name: "updateTaskState", // Tool name
                  // Arguments as a JSON string
                  arguments: JSON.stringify({
                    newStatus: NetworkStatus.Enum.NEEDS_REQUIREMENTS_CRITIQUE,
                    test_requirements: "* Req 1 (MSW API)\n* Req 2 (MSW API)",
                  }),
                },
              },
            ],
          },
          finish_reason: "tool_calls", // Important: indicates tool call
        },
      ],
      usage: {
        prompt_tokens: 15, // Dummy usage
        completion_tokens: 30,
        total_tokens: 45,
      },
    })
  }),

  // FIX: Add MSW mock for Inngest Dev Server event submission
  http.post("http://localhost:8288/e/*", async ({ request }) => {
    const payload = await request.json()
    const runId = `mock-run-id-${Date.now()}`
    log(
      "info",
      "MSW_DEV_SERVER_POST",
      `[MSW] Intercepted POST to Inngest Dev Server (/e/*). Returning runId: ${runId}`,
      { payload: JSON.stringify(payload) }
    )
    // Return a simple success response, maybe mimicking some parts of the real response
    return HttpResponse.json(
      {
        message: "Events received (MSW Mock for /e/*)",
        run_id: runId, // Provide a mock run ID
      },
      { status: 200 }
    )
  }),

  // FIX: Add mock for GET /v1/runs/:runId to simulate run completion
  http.get(`http://localhost:8288/v1/runs/:runId`, ({ params }) => {
    const { runId } = params
    log(
      "info",
      "MSW_GET_RUN",
      `[MSW] Intercepted GET /v1/runs/${runId}. Simulating completion.`
    )
    // Simulate a completed run with a mock final state
    const mockFinalState = {
      status: NetworkStatus.Enum.COMPLETED, // Simulate desired final status
      task: "Mock task completed",
      // Add other relevant state fields if needed by the test
    }
    return HttpResponse.json(
      {
        id: runId,
        status: "COMPLETED",
        output: JSON.stringify(mockFinalState), // Stringify the final state
        // Add other run properties if needed
      },
      { status: 200 }
    )
  }),
]
