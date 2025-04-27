#!/usr/bin/env node
import { createOpenCodexAgent } from "../agents/open-codex/logic/createOpenCodexAgent.js"
import readline from "node:readline/promises"
import { EventEmitter } from "events"
import chalk from "chalk"
import { simpleChatFlow } from "./flows/simpleChatFlow.js"
import { createCliAgents } from "./agents/cliAgents.js"
import { createMockDependencies } from "./utils/mockDependencies.js"
import { log as appLog } from "../utils/logic/logger.js"
import { Command } from "commander"

// Define a simple logger for console output during debugging
const simpleLogger = {
  info: (...args: unknown[]) => appLog("info", "CLI_POC_INFO", args.join(" ")),
  warn: (...args: unknown[]) => appLog("warn", "CLI_POC_WARN", args.join(" ")),
  error: (...args: unknown[]) =>
    appLog("error", "CLI_POC_ERROR", args.join(" ")),
  debug: (...args: unknown[]) =>
    appLog("info", "CLI_POC_DEBUG", args.join(" ")),
  log: (...args: unknown[]) => appLog("info", "CLI_POC_LOG", args.join(" ")),
  critic: {
    name: "MockCritic",
    description: "Mock critic agent",
    ask: async () => {
      simpleLogger.info("MockCritic answering...")
      return "LGTM!"
    },
  },
  teamLead: {
    name: "MockTeamLead",
    description: "Mock team lead agent",
    ask: async () => {
      simpleLogger.info("MockTeamLead answering...")
      return "* Requirement 1\n* Requirement 2"
    },
  },
  tooling: {
    name: "MockTooling",
    description: "Mock tooling agent",
    ask: async () => {
      simpleLogger.info("MockTooling executing...")
      return "Command executed."
    },
  },
}

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  // SECTION 1: Original PoC logic (using baseDeps)
  const simpleLogger = {
    info: (...args: unknown[]) =>
      appLog("info", "CLI_POC_INFO", args.join(" ")),
    warn: (...args: unknown[]) =>
      appLog("warn", "CLI_POC_WARN", args.join(" ")),
    error: (...args: unknown[]) =>
      appLog("error", "CLI_POC_ERROR", args.join(" ")),
    debug: (...args: unknown[]) =>
      appLog("info", "CLI_POC_DEBUG", args.join(" ")),
    log: (...args: unknown[]) => appLog("info", "CLI_POC_LOG", args.join(" ")),
  }
  const baseDeps = {
    log: simpleLogger,
    apiKey: process.env.DEEPSEEK_API_KEY || "local-mode",
    modelName: process.env.DEEPSEEK_MODEL || "deepseek-coder",
    allTools: [],
    systemEvents: new EventEmitter(),
    sandbox: null,
  }
  if (baseDeps.apiKey === "local-mode") {
    baseDeps.log.warn("Running in local mode without API key")
  }

  // Create agents for the first PoC section
  const pocAgents: Record<string, { ask: (q: string) => Promise<string> }> = {
    coder: {
      ask: async (q: string) => {
        appLog(
          "warn",
          "POC_AGENT_DISABLED",
          "PoC Coder agent call is disabled due to refactoring."
        )
        return "PoC Coder Disabled"
      },
    },
    critic: {
      ask: async (q: string) => {
        appLog(
          "warn",
          "POC_AGENT_DISABLED",
          "PoC Critic agent call is disabled due to refactoring."
        )
        return "PoC Critic Disabled"
      },
    },
    tester: {
      ask: async (q: string) => {
        appLog(
          "warn",
          "POC_AGENT_DISABLED",
          "PoC Tester agent call is disabled due to refactoring."
        )
        return "PoC Tester Disabled"
      },
    },
    teamlead: {
      ask: async (q: string) => {
        appLog(
          "warn",
          "POC_AGENT_DISABLED",
          "PoC TeamLead agent call is disabled due to refactoring."
        )
        return "PoC TeamLead Disabled"
      },
    },
    tooling: {
      ask: async (q: string) => {
        appLog(
          "warn",
          "POC_AGENT_DISABLED",
          "PoC Tooling agent call is disabled due to refactoring."
        )
        return "PoC Tooling Disabled"
      },
    },
  }
  const pocOpenCodexAgent = createOpenCodexAgent(pocAgents as any)

  // Ensure baseDeps includes placeholder instructions if needed by agents called here
  // (Although pocAgents definitions now include instructions during creation)

  baseDeps.log.info("Open Codex Chat (PoC)")
  baseDeps.log.info("Доступные команды:")
  baseDeps.log.info("  coder: вопрос - задать вопрос кодирующему агенту")
  baseDeps.log.info("  critic: вопрос - задать вопрос критикующему агенту")
  baseDeps.log.info("  tester: вопрос - задать вопрос тестирующему агенту")
  baseDeps.log.info("  teamlead: вопрос - задать вопрос лидеру команды")
  baseDeps.log.info("  tooling: вопрос - задать вопрос инструментарию")
  baseDeps.log.info("  exit - выйти\n")

  let running = true
  while (running) {
    const question = await rl.question(`${chalk.blue("PoC Mode You:")} `)
    if (question.toLowerCase() === "exit") {
      running = false
      continue
    }

    try {
      const response = await pocOpenCodexAgent.ask(question)
      baseDeps.log.info("PoC Open Codex Response:", response)
    } catch (err) {
      baseDeps.log.error(
        "PoC Error:",
        err instanceof Error ? err.message : String(err)
      )
    }
  }
  rl.close()
  appLog("info", "CLI_INFO", "PoC Mode exited. Starting main flow...")

  // SECTION 2: Main logic using createMockDependencies
  const dependencies = createMockDependencies()

  // Create agents using the main dependencies - NOW ASYNC
  // createCliAgents now handles instruction loading internally
  const agents = await createCliAgents()

  // Example interaction loop using main agents (coder/tester from createCliAgents)
  let currentQuestion = "Write a simple TypeScript function to add two numbers."

  for (let i = 0; i < 2; i++) {
    // Use the agents obtained from createCliAgents which have .run methods
    const codeResult = await agents.coder.run(currentQuestion)
    const code = codeResult?.output?.join("\n") ?? ""
    if (!code) {
      appLog("warn", "MAIN_FLOW", "Coder did not provide code. Exiting loop.")
      break
    }
    appLog(
      "info",
      "MAIN_FLOW",
      `\n${chalk.blue("Coder")}: Code generated:\n${chalk.green(code)}`
    )

    // Use the agents obtained from createCliAgents
    const testResult = await agents.tester.run(`Review this code:\n\n${code}`)
    const review = testResult?.output?.join("\n") ?? ""
    appLog("info", "MAIN_FLOW", `\n${chalk.yellow("Tester")}: ${review}`)

    currentQuestion = "Great! Now add error handling for non-number inputs."
    appLog(
      "info",
      "MAIN_FLOW",
      `\n${chalk.blue("Coder")}: Next request: ${currentQuestion}`
    )
  }

  appLog("info", "MAIN_FLOW", "\nExample interaction finished.")

  // Run the predefined flow using main agents
  appLog("info", "MAIN_FLOW", "\n--- Running Simple Chat Flow ---")
  // Pass the awaited agents
  await simpleChatFlow(agents)
  appLog("info", "MAIN_FLOW", "--- Simple Chat Flow Finished ---")
}

main().catch(err => {
  appLog(
    "error",
    "CLI_FATAL",
    `Unhandled error in main: ${err instanceof Error ? err.message : String(err)}`
  )
  console.error("Unhandled error:", err)
  process.exit(1)
})

export async function runAgentChat() {
  simpleLogger.info("AGENT_CHAT_START", "Starting agent chat...")

  // Create dependencies (currently mocks) - Remove unused
  // const dependencies = createMockDependencies()

  // Create agent instances for the CLI - Remove argument
  const agents = await createCliAgents()

  simpleLogger.info("AGENT_CHAT_AGENTS_READY", "Agents created.")

  // Mock simple interaction for demonstration
  const currentQuestion = "Write a simple add function."
  simpleLogger.info("Initial question:", currentQuestion)

  try {
    // Use .run instead of .ask
    const codeResult = await agents.coder.run(currentQuestion)
    const code = codeResult?.output?.join("\n") ?? ""
    simpleLogger.info("Coder response:", code)

    if (code) {
      // Use .run instead of .ask
      const testResult = await agents.tester.run(`Test this code:\n${code}`)
      const testOutput = testResult?.output?.join("\n") ?? ""
      simpleLogger.info("Tester response:", testOutput)
    }
  } catch (error: any) {
    simpleLogger.error("Error during agent interaction:", error.message)
  }

  // Run a predefined flow - pass the full agents object
  await simpleChatFlow(agents)

  simpleLogger.info("AGENT_CHAT_END", "Agent chat finished.")
}

// Command line argument parsing (placeholder)
const program = new Command()

program
  .name("agent-chat")
  .description("CLI for interacting with coding agents")
  .version("0.1.0")
  .action(() => {
    runAgentChat().catch(error => {
      simpleLogger.error("Unhandled error in agent chat:", error)
      process.exit(1)
    })
  })

program.parse(process.argv)

// Example usage:
// Directly run the main chat function if no command is specified,
// or integrate with commander actions.
if (!process.argv.slice(2).length) {
  runAgentChat().catch(error => {
    simpleLogger.error("Unhandled error:", error)
    process.exit(1)
  })
}
