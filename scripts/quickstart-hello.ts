#!/usr/bin/env bun
import "dotenv/config" // Load .env variables
import { createAgent, createNetwork, openai } from "@inngest/agent-kit"
// Removed import for deepseekAdapter

console.log("--- AgentKit Quickstart Hello (via OpenRouter) ---")

// Check if OpenRouter API key is available
const openRouterApiKey = process.env.OPENROUTER_API_KEY
if (!openRouterApiKey) {
  console.error("❌ ERROR: OPENROUTER_API_KEY environment variable is not set.")
  process.exit(1)
}

const openRouterBaseURL = "https://openrouter.ai/api/v1"
// const modelName = "deepseek/chat" // Or 'deepseek/coder'
const modelName = "openai/gpt-3.5-turbo" // TRY STANDARD OPENAI MODEL via OpenRouter
const defaultHeaders = {
  "HTTP-Referer": "http://localhost", // Optional, but recommended
  "X-Title": "999-agentkit-tdd", // Optional, but recommended
}

// --- Create OpenAI adapter configured for OpenRouter ---
const openRouterModelAdapter = openai({
  model: modelName,
  apiKey: openRouterApiKey,
  baseURL: openRouterBaseURL,
  defaultHeaders: defaultHeaders,
  // defaultParameters can be added if needed (e.g., temperature)
})

// 1. Create a simple Agent (using OpenRouter)
const helloAgent = createAgent({
  name: "Hello Agent",
  description: "A simple agent that says hello.",
  system: "You are a friendly agent. Respond concisely.",
  model: openRouterModelAdapter, // Use the configured adapter
})

// 2. Create a simple Network
const helloNetwork = createNetwork({
  name: "Hello Network",
  agents: [helloAgent],
  defaultModel: openRouterModelAdapter, // Use the configured adapter
  // No complex state or router needed for this test
})

// 3. Run the Network
async function runHello() {
  const prompt = 'Say "Hello, AgentKit!"'
  console.log(`🚀 Running network with prompt: "${prompt}" via OpenRouter`)

  try {
    const result = await helloNetwork.run(prompt)

    console.log("✅ Network run completed.")
    console.log("--- Result ---")
    // Log the structured output
    console.log(JSON.stringify(result, null, 2))

    // Extract and log the last text message content
    const lastMessage = result.history[result.history.length - 1]?.output?.[0]
    if (lastMessage && lastMessage.type === "text") {
      console.log("\n💬 Agent Response:", lastMessage.content)
    } else {
      console.log("\n⚠️ Could not extract final text response.")
    }
  } catch (error) {
    console.error("❌ Network run failed:")
    if (error instanceof Error) {
      console.error("Error Message:", error.message)
      console.error("Error Stack:", error.stack)
    } else {
      console.error("Unknown Error:", error)
    }
    process.exit(1)
  }
}

runHello()
