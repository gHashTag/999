#!/usr/bin/env node
import { createCodingAgent } from "../agents/coder/logic/createCodingAgent.js"
import { createCriticAgent } from "../agents/critic/logic/createCriticAgent.js"
import { createTesterAgent } from "../agents/tester/logic/createTesterAgent.js"
import { createTeamLeadAgent } from "../agents/teamlead/logic/createTeamLeadAgent.js"
import { createToolingAgent } from "../agents/tooling/logic/createToolingAgent.js"
import { log as appLog } from "../utils/logic/logger.js"
import { systemEvents } from "../utils/logic/systemEvents.js"
import { getAllTools } from "../tools/toolDefinitions.js"
import { getSandbox } from "../inngest/utils/sandboxUtils.js"
import { readAgentInstructions } from "../utils/logic/readAgentInstructions.js"
import type { AgentDependencies, HandlerLogger } from "../types/agents.js"
import { Command } from "commander"
import fs from "fs/promises"
import ora from "ora"
import readline from "readline/promises"
import { EventEmitter } from "events"
import { createMockLogger } from "../utils/logic/mockLogger.js"
import { SystemEventEmitter } from "../types/systemEvents.js"
import { mockDeepseekModel } from "../utils/logic/mockDeepseekModel.js"
import { getAllTools as getAllToolsRelative } from "../tools/toolDefinitions.js"
import { AgentDependencies as AgentDependenciesRelative } from "../types/agents.js"
import {
  createCoderAgent,
  createCriticAgent as createCriticAgentRelative,
} from "../agents/index.js"
import { Sandbox } from "e2b"
import { GetSandboxFunc } from "../inngest/utils/sandboxUtils.js"

// Use the imported appLog as the logger for this CLI
const log: HandlerLogger = createMockLogger("OpenCodexCLI")

// Define a simple logger for cases where HandlerLogger might not be fully compatible
// or for direct console output if needed during debugging.
const simpleLogger = {
  info: (...args: any[]) => console.log("[INFO]", ...args),
  warn: (...args: any[]) => console.warn("[WARN]", ...args),
  error: (...args: any[]) => console.error("[ERROR]", ...args),
  debug: (...args: any[]) => console.debug("[DEBUG]", ...args),
}

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  log.info("Initializing Open Codex CLI agents...")
  const apiKey = process.env.DEEPSEEK_API_KEY || ""
  const modelName = process.env.OPEN_CODEX_MODEL || "deepseek-coder"

  if (!apiKey) {
    log.warn("DEEPSEEK_API_KEY not found in environment for Open Codex CLI.")
  }

  const sandbox = await getSandbox("")
  const eventId = "codex-cli-event-main"
  const allTools = getAllToolsRelative(
    log,
    getSandbox,
    eventId,
    sandbox?.sandboxId ?? null
  )

  log.info("Loading agent instructions for Open Codex CLI...")
  const [
    coderInstructions,
    criticInstructions,
    testerInstructions,
    teamLeadInstructions,
    toolingInstructions,
  ] = await Promise.all([
    readAgentInstructions("Coder"),
    readAgentInstructions("Critic"),
    readAgentInstructions("Tester"),
    readAgentInstructions("TeamLead"),
    readAgentInstructions("Tooling"),
  ])
  log.info("Instructions loaded for Open Codex CLI agents.")

  const mockSystemEvents = new EventEmitter() as SystemEventEmitter
  const mockLogger = createMockLogger("OpenCodexCLI")

  const baseDeps: Omit<AgentDependenciesRelative, "agents"> = {
    apiKey: process.env.DEEPSEEK_API_KEY || "mock-api-key",
    modelName: process.env.OPEN_CODEX_MODEL || "deepseek-coder",
    model: mockDeepseekModel,
    allTools: getAllToolsRelative(log, async () => sandbox, eventId, null),
    log: log,
    systemEvents: new EventEmitter() as SystemEventEmitter,
    sandbox,
    eventId,
  }

  const agents = {
    coder: createCodingAgent({ ...baseDeps, instructions: coderInstructions }),
    critic: createCriticAgentRelative({
      ...baseDeps,
      instructions: criticInstructions,
    }),
    tester: createTesterAgent({
      ...baseDeps,
      instructions: testerInstructions,
    }),
    teamLead: createTeamLeadAgent({
      ...baseDeps,
      instructions: teamLeadInstructions,
    }),
    tooling: createToolingAgent({
      ...baseDeps,
      instructions: toolingInstructions,
    }),
  }
  log.info("Open Codex CLI agents created.")

  // Placeholder for the open-codex agent logic - adjust as needed
  const openCodexAgent = {
    ask: async (question: string) => {
      log.info("Open Codex Agent received:", question)
      return "Mock response"
    },
  }

  while (true) {
    const question = await rl.question(
      "Enter your request (or type 'agent:message' or 'exit'): "
    )

    if (question.toLowerCase() === "exit") {
      break
    }

    const match = question.match(/^(\w+):\s*(.*)$/)

    if (match) {
      const agentName = match[1].toLowerCase().trim()
      const message = match[2]

      if (agentName === "opencodex" || agentName === "open_codex") {
        const spinner = ora("Open Codex Agent thinking...").start()
        try {
          const response = await openCodexAgent.ask(message.trim())
          spinner.succeed("Open Codex Agent responded.")
          simpleLogger.info("Open Codex Agent:", response)
        } catch (err) {
          spinner.fail("Open Codex Agent failed.")
          simpleLogger.error(
            `Error in Open Codex agent communication: ${err instanceof Error ? err.message : String(err)}`
          )
        }
      } else if (agents[agentName as keyof typeof agents]) {
        const targetAgent = agents[agentName as keyof typeof agents]
        const spinner = ora(`${agentName} Agent thinking...`).start()
        try {
          const result = await targetAgent.run(message.trim())
          spinner.succeed(`${agentName} Agent responded.`)
          simpleLogger.info(
            `${agentName} Agent:`,
            result?.output?.join("\n") ?? "No output"
          )
        } catch (err: unknown) {
          spinner.fail(`${agentName} Agent failed.`)
          simpleLogger.error(
            `Error in ${agentName} agent communication: ${err instanceof Error ? err.message : String(err)}`
          )
        }
      } else {
        simpleLogger.error(`Unknown agent: ${agentName}`)
      }
    } else {
      // Default to coder agent if no prefix
      const spinner = ora("Coder Agent thinking...").start()
      try {
        const result = await agents.coder.run(question)
        spinner.succeed("Coder Agent responded.")
        simpleLogger.info(
          "Coder Agent:",
          result?.output?.join("\n") ?? "No output"
        )
      } catch (error: any) {
        spinner.fail("Coder Agent failed.")
        simpleLogger.error("Error interacting with Coder agent:", error.message)
      }
    }
  }

  rl.close()
}

main().catch((err: unknown) => {
  simpleLogger.error(
    `Unhandled error in main function: ${err instanceof Error ? err.message : String(err)}`
  )
  process.exit(1)
})

// --- Commander Setup ---
const program = new Command()

program
  .name("open-codex-cli")
  .description("CLI wrapper for the Open Codex library")
  .version("0.1.0")

program
  .command("generate")
  .description("Generate code based on a prompt and optional context files")
  .option("-p, --prompt <string>", "The main prompt for code generation", "")
  .option("-pf, --prompt-file <path>", "Path to a file containing the prompt")
  .option(
    "-c, --context-files <paths...>",
    "Paths to files or directories to use as context"
  )
  .option("-o, --output-file <path>", "Path to save the generated code")
  .option(
    "-e, --execute",
    "Execute the generated code in a sandbox (requires E2B setup)"
  )
  .action(async options => {
    let prompt = options.prompt
    if (options.promptFile) {
      try {
        prompt = await fs.readFile(options.promptFile, "utf-8")
        log.info(
          "CLI_PROMPT_FILE",
          `Read prompt from file: ${options.promptFile}`
        )
      } catch (err: any) {
        log.error(
          "CLI_PROMPT_FILE_ERROR",
          `Error reading prompt file: ${err.message}`
        )
        process.exit(1)
      }
    }
    if (!prompt) {
      log.error(
        "CLI_PROMPT_REQUIRED",
        "Error: Prompt is required. Use -p or -pf."
      )
      process.exit(1)
    }
    try {
      log.warn("generate command needs implementation using created agents.")
    } catch (error: any) {
      log.error(
        "CLI_GENERATE_ERROR",
        `Generate command failed: ${error.message}`
      )
      process.exit(1)
    }
  })

program.parse(process.argv)
