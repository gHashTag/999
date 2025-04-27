import { CliAgents } from "../agents/cliAgents" // Adjusted path

/**
 * Runs a simple demo chat flow between Coder and Tester agents.
 * @param agents - An object containing the initialized CLI agents.
 */
export async function runSimpleChatFlow(agents: CliAgents) {
  console.log("Starting simple agent chat flow...")

  // Simple demo: coder asks tester to test some code
  const question = "Write a function that adds two numbers"

  console.log(`\nCoder asks: ${question}`)
  const code = await agents.coder.ask(question)
  console.log(`\nCoder response:\n${code}`)

  // Check if coder returned an error message
  if (code.startsWith("Error:")) {
    console.error("Coder failed, stopping flow.")
    return
  }

  console.log(`\nTester reviews the code...`)
  const testResult = await agents.tester.ask(`Test this code:\n${code}`)
  console.log(`\nTester response:\n${testResult}`)

  console.log("\nSimple chat flow finished.")
}
