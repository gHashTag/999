#!/usr/bin/env node
import { createOpenCodexAgent } from "../agents/open-codex/logic/createOpenCodexAgent.js"
import { createCodingAgent } from "../agents/coder/logic/createCodingAgent.js"
import { createCriticAgent } from "../agents/critic/logic/createCriticAgent.js"
import { createTesterAgent } from "../agents/tester/logic/createTesterAgent.js"
import { createTeamLeadAgent } from "../agents/teamlead/logic/createTeamLeadAgent.js"
import { createToolingAgent } from "../agents/tooling/logic/createToolingAgent.js"
import readline from "node:readline/promises"
import { EventEmitter } from "events"
import chalk from "chalk"
import { simpleChatFlow } from "./flows/simpleChatFlow.js"
import { createCliAgents } from "./agents/cliAgents.js"
import { createMockDependencies } from "./utils/mockDependencies.js"
import { log } from "@/utils/logic/logger"

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  // SECTION 1: Original PoC logic (using baseDeps)
  const simpleLogger = {
    info: (...args: unknown[]) => log("info", "CLI_POC_INFO", args.join(" ")),
    warn: (...args: unknown[]) => log("warn", "CLI_POC_WARN", args.join(" ")),
    error: (...args: unknown[]) =>
      log("error", "CLI_POC_ERROR", args.join(" ")),
    debug: (...args: unknown[]) => log("info", "CLI_POC_DEBUG", args.join(" ")),
    log: (...args: unknown[]) => log("info", "CLI_POC_LOG", args.join(" ")),
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
        const r = await createCodingAgent(baseDeps).run(q)
        return r?.output?.join("\n") ?? ""
      },
    },
    critic: {
      ask: async (q: string) => {
        const r = await createCriticAgent(baseDeps).run(q)
        return r?.output?.join("\n") ?? ""
      },
    },
    tester: {
      ask: async (q: string) => {
        const r = await createTesterAgent(baseDeps).run(q)
        return r?.output?.join("\n") ?? ""
      },
    },
    teamlead: {
      ask: async (q: string) => {
        const r = await createTeamLeadAgent(baseDeps).run(q)
        return r?.output?.join("\n") ?? ""
      },
    },
    tooling: {
      ask: async (q: string) => {
        const r = await createToolingAgent(baseDeps).run(q)
        return r?.output?.join("\n") ?? ""
      },
    },
  }
  const pocOpenCodexAgent = createOpenCodexAgent(pocAgents as any)

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
  log("info", "CLI_INFO", "PoC Mode exited. Starting main flow...")

  // SECTION 2: Main logic using createMockDependencies
  const dependencies = createMockDependencies()

  // Create agents using the main dependencies
  const { coder, tester } = createCliAgents(dependencies)

  // Example interaction loop using main agents
  let currentQuestion = "Write a simple TypeScript function to add two numbers."

  for (let i = 0; i < 2; i++) {
    const codeResponse = await coder.ask(currentQuestion)
    const code = codeResponse
    if (!code) {
      log("warn", "MAIN_FLOW", "Coder did not provide code. Exiting loop.")
      break
    }
    log(
      "info",
      "MAIN_FLOW",
      `\n${chalk.blue("Coder")}: Code generated:\n${chalk.green(code)}`
    )

    const testResponse = await tester.ask(`Review this code:\n\n${code}`)
    const review = testResponse
    log("info", "MAIN_FLOW", `\n${chalk.yellow("Tester")}: ${review}`)

    currentQuestion = "Great! Now add error handling for non-number inputs."
    log(
      "info",
      "MAIN_FLOW",
      `\n${chalk.blue("Coder")}: Next request: ${currentQuestion}`
    )
  }

  log("info", "MAIN_FLOW", "\nExample interaction finished.")

  // Run the predefined flow using main agents
  log("info", "MAIN_FLOW", "\n--- Running Simple Chat Flow ---")
  await simpleChatFlow({ coder, tester })
  log("info", "MAIN_FLOW", "--- Simple Chat Flow Finished ---")
}

main().catch(err => {
  log(
    "error",
    "CLI_FATAL",
    `Unhandled error in main: ${err instanceof Error ? err.message : String(err)}`
  )
  console.error("Unhandled error:", err)
  process.exit(1)
})
