import { createCliAgents } from "../agents/cliAgents.js"
import { createMockDependencies } from "../utils/mockDependencies.js"
import { log } from "@/utils/logic/logger" // Import the logger

/**
 * A simple flow demonstrating interaction between Coder and Tester agents.
 */
export async function simpleChatFlow(
  agents?: ReturnType<typeof createCliAgents>
) {
  log("info", "FLOW_START", "Starting simple agent chat flow...")

  // Use provided agents or create new ones if not provided
  const { coder, tester } = agents || createCliAgents(createMockDependencies())

  // Initial prompt for the Coder
  const question = "Generate a simple TypeScript function to add two numbers."
  log("info", "FLOW_ASK_CODER", `Coder asks: ${question}`)

  // Coder generates code
  const codeResponse = await coder.ask(question)
  const code = codeResponse
  if (!code) {
    log("warn", "FLOW_NO_CODE", "Coder did not generate code.")
    return
  }
  log("info", "FLOW_CODE_RESPONSE", `Coder response:\n${code}`)

  // Tester reviews the code
  log("info", "FLOW_ASK_TESTER", `Tester reviews the code...`)
  const testResponse = await tester.ask(`Review this code:\n${code}`)
  const testResult = testResponse
  log("info", "FLOW_TEST_RESPONSE", `Tester response:\n${testResult}`)

  log("info", "FLOW_END", "Simple chat flow finished.")
}
