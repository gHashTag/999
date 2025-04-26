import { http, HttpResponse } from "msw"

// Define a basic mock response for the DeepSeek API
const mockDeepseekResponse = {
  id: "chatcmpl-mock-id",
  object: "chat.completion",
  created: Date.now(),
  model: "deepseek-chat", // Or whatever model is expected
  choices: [
    {
      index: 0,
      message: {
        role: "assistant",
        content: '{\n  "tool_calls": []\n}', // Simple response indicating no tool calls
      },
      finish_reason: "stop",
    },
  ],
  usage: {
    prompt_tokens: 10,
    completion_tokens: 5,
    total_tokens: 15,
  },
}

export const handlers = [
  // Intercept POST requests to the DeepSeek chat completions endpoint
  http.post("https://api.deepseek.com/v1/chat/completions", ({ request }) => {
    console.log(`[MSW] Intercepted ${request.method} ${request.url}`)
    // Return a mocked JSON response with status 200
    return HttpResponse.json(mockDeepseekResponse)
  }),

  // Add other handlers here if needed for other APIs

  // Mock Inngest event API
  http.post("http://localhost:8288/e/:key", ({ params }) => {
    console.log(`[MSW] Intercepted Inngest event to ${params.key}`)
    return HttpResponse.json({
      status: 200,
      body: JSON.stringify({
        state: {
          status: "NEEDS_REQUIREMENTS_CRITIQUE",
          task: "Create a simple add function.",
          test_requirements: [
            "Should add two numbers correctly",
            "Should handle negative numbers",
            "Should return 0 when no arguments provided",
          ],
        },
      }),
    })
  }),
]
