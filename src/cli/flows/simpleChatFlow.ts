import { CliAgents } from "../agents/cliAgents"
// import { createMockDependencies } from "../utils/mockDependencies.js" // Remove unused import
// import { createCliAgents } from "../agents/cliAgents.js" // Remove unused import
import { log } from "@/utils/logic/logger"

/**
 * A simple, hardcoded chat flow for demonstrating agent interaction.
 */
export async function simpleChatFlow(agents: CliAgents) {
  log("info", "SIMPLE_FLOW_START", "Starting simple chat flow...")

  const { coder, tester } = agents // Use agents passed as arguments

  let currentQuestion = "Write a simple TypeScript function to add two numbers."
  log("info", "SIMPLE_FLOW_Q1", `Initial question: ${currentQuestion}`)

  try {
    // Interaction 1: Coder generates code
    const codeResult = await coder.run(currentQuestion) // Use .run
    const code = codeResult?.output?.join("\n") ?? ""
    if (!code) {
      log("warn", "SIMPLE_FLOW_NO_CODE", "Coder did not provide code.")
      return
    }
    log("info", "SIMPLE_FLOW_CODE", `Coder generated:\n${code}`)

    // Interaction 2: Tester reviews code
    const testInput = `Review this code:\n\n${code}`
    const testResult = await tester.run(testInput) // Use .run
    const review = testResult?.output?.join("\n") ?? ""
    log("info", "SIMPLE_FLOW_REVIEW", `Tester review: ${review}`)

    // Interaction 3: Coder refines based on review (or next question)
    currentQuestion = `Refine the code based on this review: ${review}. Or just add error handling for non-number inputs.`
    log("info", "SIMPLE_FLOW_Q2", `Next question: ${currentQuestion}`)
    const refinedCodeResult = await coder.run(currentQuestion) // Use .run
    const refinedCode = refinedCodeResult?.output?.join("\n") ?? ""
    log("info", "SIMPLE_FLOW_REFINED", `Coder refinement:\n${refinedCode}`)
  } catch (error) {
    log(
      "error",
      "SIMPLE_FLOW_ERROR",
      `Error during simple flow: ${error instanceof Error ? error.message : String(error)}`
    )
  }

  log("info", "SIMPLE_FLOW_END", "Simple chat flow finished.")
}
