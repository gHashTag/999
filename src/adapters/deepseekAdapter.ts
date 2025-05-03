/**
 * Minimal Deepseek Adapter Stub for AgentKit integration testing.
 */

interface DeepseekAdapterOptions {
  model: string
  apiKey?: string
  // Add other necessary options based on Deepseek API
}

interface DeepseekRunResult {
  output: any[] // Simplified output structure
  // Add other fields AgentKit might expect from run result
  raw?: any
  history?: any[]
  prompt?: any[]
  toolCalls?: any[]
}

export const createDeepseekAdapter = (options: DeepseekAdapterOptions) => {
  const run = async (
    _input: string,
    _runOptions?: any
  ): Promise<DeepseekRunResult> => {
    // This function will be mocked in tests.
    // In real usage, it would call the Deepseek API.
    console.warn("Called unmocked Deepseek adapter run method!")
    // Return a default structure similar to what the test expects
    return {
      output: [
        {
          type: "tool_call",
          role: "assistant",
          tools: [
            {
              name: "updateTaskState",
              input: {
                newStatus: "NEEDS_REQUIREMENTS_CRITIQUE",
                test_requirements: "Default Deepseek stub requirements",
              },
            },
          ],
          stop_reason: "tool",
        },
      ],
      raw: { message: "Default Deepseek stub response" },
      history: [],
      prompt: [],
      toolCalls: [],
    }
  }

  return {
    format: "deepseek", // Define a format string
    run,
    // Add infer method stub if needed
    infer: async (_input: any, _inferOptions?: any) => {
      console.warn("Called unmocked Deepseek adapter infer method!")
      return { choices: [{ message: { content: "Default infer response" } }] }
    },
    // Add other potential properties AgentKit might expect
    // based on inspection or documentation, e.g.:
    apiKey: options.apiKey,
    model: options.model,
  }
}

export type DeepseekAdapter = ReturnType<typeof createDeepseekAdapter>
