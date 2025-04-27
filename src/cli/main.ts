// import chalk from "chalk"
import { createMockDependencies } from "./utils/mockDependencies.js"
import { createCliAgents } from "./agents/cliAgents.js"
import { simpleChatFlow } from "./flows/simpleChatFlow.js"
import { log } from "@/utils/logic/logger"

/**
 * Main entry point for the CLI agent chat PoC.
 */
async function main() {
  log("info", "CLI_START", "Initializing CLI agent chat...")

  try {
    // 1. Create dependencies (currently mocks)
    const dependencies = createMockDependencies()
    log("info", "CLI_DEPS", "Dependencies created.")

    // 2. Create agent instances for the CLI
    const agents = createCliAgents(dependencies)
    log("info", "CLI_AGENTS", "CLI agents created.")

    // 3. Run the desired flow
    await simpleChatFlow(agents)

    log("info", "CLI_END", "CLI agent chat finished successfully.")
  } catch (error) {
    console.error("Error during CLI agent chat execution:", error)
    process.exit(1) // Exit with error code
  }
}

// Run the main function
main().catch(error => {
  console.error("Error during CLI agent chat execution:", error)
  process.exit(1)
})
