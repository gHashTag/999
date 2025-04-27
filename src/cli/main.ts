import { createMockDependencies } from "./utils/mockDependencies"
import { createCliAgents } from "./agents/cliAgents"
import { runSimpleChatFlow } from "./flows/simpleChatFlow"

/**
 * Main entry point for the CLI agent chat PoC.
 */
async function main() {
  console.log("Initializing CLI agent chat...")

  try {
    // 1. Create dependencies (currently mocks)
    const dependencies = createMockDependencies()
    console.log("Dependencies created.")

    // 2. Create agent instances for the CLI
    const agents = createCliAgents(dependencies)
    console.log("CLI agents created.")

    // 3. Run the desired flow
    await runSimpleChatFlow(agents)

    console.log("CLI agent chat finished successfully.")
  } catch (error) {
    console.error("An error occurred during the CLI agent chat:", error)
    process.exit(1) // Exit with error code
  }
}

// Run the main function
main()
