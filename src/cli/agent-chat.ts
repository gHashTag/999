#!/usr/bin/env node
import { createOpenCodexAgent } from "../agents/open-codex/logic/createOpenCodexAgent"
import { createCodingAgent } from "../agents/coder/logic/createCodingAgent"
import { dependencies } from "../__tests__/agents/testSetup"
import readline from "node:readline/promises"

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  // Используем готовые моки из тестов
  const baseDeps = dependencies

  // Создаем только кодирующего агента для PoC
  const agents = {
    coder: {
      ask: async (q: string) => {
        const result = await createCodingAgent(baseDeps).run(q)
        if (!result || !result.output) {
          throw new Error("Invalid response from coder agent")
        }
        return result.output.join("\n")
      },
    },
  }

  const agent = createOpenCodexAgent(agents)

  dependencies.log.info("Open Codex Chat (PoC)")
  dependencies.log.info("Доступные команды:")
  dependencies.log.info("  coder: вопрос - задать вопрос кодирующему агенту")
  dependencies.log.info("  вопрос - задать вопрос Open Codex")
  dependencies.log.info("  exit - выйти\n")

  let running = true
  while (running) {
    const question = await rl.question("You: ")
    if (question.toLowerCase() === "exit") {
      running = false
      continue
    }

    try {
      const response = await agent.ask(question)
      console.log("Response:", response)
    } catch (err) {
      dependencies.log.error(
        "Error:",
        err instanceof Error ? err.message : String(err)
      )
    }
  }

  rl.close()
}

main().catch(err => {
  dependencies.log.error("Unhandled error:", err)
  process.exit(1)
})
