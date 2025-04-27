import { http, HttpResponse } from "msw"
// import { NetworkStatus } from "@/types/network"

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
    console.log(
      `[MSW] Intercepted POST /api/inngest for event: ${JSON.stringify(event)}. Returning ID: ${eventId}`
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
    console.log("[MSW] Intercepted DeepSeek API call")
    // Return a generic successful response for LLM calls
    return HttpResponse.json({
      id: "chatcmpl-mock-id",
      object: "chat.completion",
      created: Date.now(),
      model: "deepseek-coder",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content:
              '```json\n{"approved": true, "critique": "MSW Mock Response: LGTM!", "refactored_code": null}\n```', // Example mock response
          },
          finish_reason: "stop",
        },
      ],
      usage: {
        prompt_tokens: 10,
        completion_tokens: 20,
        total_tokens: 30,
      },
    })
  }),

  // FIX: Add MSW mock for Inngest Dev Server event submission
  http.post("http://localhost:8288/e/*", async ({ request }) => {
    const payload = await request.json()
    const runId = `mock-run-id-${Date.now()}`
    console.log(
      `[MSW] Intercepted POST to Inngest Dev Server (/e/*) with payload: ${JSON.stringify(payload)}. Returning runId: ${runId}`
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
]
