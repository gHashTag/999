import {
  Agent,
  openai,
  type AgentResult,
  type TextMessage,
} from "@inngest/agent-kit"
import { spyOn, expect, it } from "bun:test"

it("should run agent with mocked API call", async () => {
  console.log(
    "Using OpenRouter API Key:",
    process.env.OPENROUTER_API_KEY?.substring(0, 5) + "****"
  )
  const openRouterBaseUrl = "https://openrouter.ai/api/v1"
  console.log("Base URL for API:", openRouterBaseUrl)

  const modelAdapter = openai({
    model: "anthropic/claude-3-opus-20240229",
    apiKey: process.env.OPENROUTER_API_KEY || "sk-or-dummy-key",
    baseUrl: openRouterBaseUrl,
    defaultParameters: {
      temperature: 0,
    },
  })

  const agent = new Agent({
    name: "TestAgentForRealIntegration",
    system: "You are a test agent.",
    model: modelAdapter,
  })

  console.log(
    "Agent initialized with model anthropic/claude-3-opus-20240229 via OpenRouter"
  )

  const mockedRunOutputText = "Hello, World! Mocked!"

  const mockedAgentResultOutput: TextMessage[] = [
    { type: "text", role: "assistant", content: mockedRunOutputText },
  ]
  const mockedAgentResult: Partial<AgentResult> = {
    output: mockedAgentResultOutput,
  }

  spyOn(agent, "run").mockImplementation(async (prompt: string) => {
    console.log(`Mocked agent.run called with prompt: ${prompt}`)
    return mockedAgentResult as AgentResult
  })

  try {
    const finalResult = await agent.run(
      'Return the string "Hello, World!" as is.'
    )

    console.log("Agent run result (mocked):", finalResult)
    if (
      finalResult.output &&
      finalResult.output.length > 0 &&
      finalResult.output[0].type === "text"
    ) {
      expect(finalResult.output[0].content).toBe(mockedRunOutputText)
    } else {
      expect(finalResult.output[0].type).toBe("text")
      expect((finalResult.output[0] as TextMessage).content).toBe(
        mockedRunOutputText
      )
    }
  } catch (error) {
    console.error("Error during agent run:", error)
    throw error
  }
})
