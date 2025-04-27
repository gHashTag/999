#!/usr/bin/env node
import { createOpenCodexAgent } from "../agents/open-codex/logic/createOpenCodexAgent"
import { createCodingAgent } from "../agents/coder/logic/createCodingAgent"
import { createCriticAgent } from "../agents/critic/logic/createCriticAgent"
import { createTesterAgent } from "../agents/tester/logic/createTesterAgent"
import { createTeamLeadAgent } from "../agents/teamlead/logic/createTeamLeadAgent"
import { createToolingAgent } from "../agents/tooling/logic/createToolingAgent"
import readline from "node:readline/promises"
import { EventEmitter } from "events"
import { type HandlerLogger } from "@/types/agents"

// Создаем логгер для агентов
const simpleLogger: HandlerLogger = {
  info: (...args: unknown[]): void => console.log("[INFO]", ...args),
  warn: (...args: unknown[]): void => console.warn("[WARN]", ...args),
  error: (...args: unknown[]): void => console.error("[ERROR]", ...args),
  debug: (...args: unknown[]): void => console.debug("[DEBUG]", ...args),
  log: (...args: unknown[]): void => console.log(...args),
}

// Полная mock реализация sandbox
// Используем null вместо mock объекта, так как sandbox опционален в AgentDependencies
const sandbox = null

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  // Минимальные зависимости для агентов
  const baseDeps = {
    log: simpleLogger,
    apiKey: process.env.DEEPSEEK_API_KEY || "",
    modelName: process.env.DEEPSEEK_MODEL || "deepseek-coder",
    allTools: [],
    systemEvents: new EventEmitter(),
    sandbox: sandbox,
  }

  // Для PoC отключаем проверку API ключа
  if (!baseDeps.apiKey) {
    simpleLogger.warn("Running in local mode without API key")
    baseDeps.apiKey = "local-mode"
  }

  // Для PoC пропускаем проверку валидности API ключа

  // Создаем всех доступных агентов с методом run
  const agents: Record<string, { ask: (q: string) => Promise<string> }> = {
    coder: {
      ask: async (q: string): Promise<string> => {
        const result = await createCodingAgent(baseDeps).run(q)
        if (!result || !result.output) {
          throw new Error("Invalid response from coder agent")
        }
        const message = result.output.join("\n")
        baseDeps.systemEvents.emit("agentMessage", {
          from: "coder",
          to: "user",
          message,
        })
        return message
      },
    },
    critic: {
      ask: async (q: string) => {
        const result = await createCriticAgent(baseDeps).run(q)
        baseDeps.systemEvents.emit("agentMessage", {
          from: "critic",
          to: "user",
          message: result.output.join("\n"),
        })
        return result.output.join("\n")
      },
    },
    tester: {
      ask: async (q: string) => {
        const result = await createTesterAgent(baseDeps).run(q)
        baseDeps.systemEvents.emit("agentMessage", {
          from: "tester",
          to: "user",
          message: result.output.join("\n"),
        })
        return result.output.join("\n")
      },
    },
    teamlead: {
      ask: async (q: string) => {
        const result = await createTeamLeadAgent(baseDeps).run(q)
        baseDeps.systemEvents.emit("agentMessage", {
          from: "teamlead",
          to: "user",
          message: result.output.join("\n"),
        })
        return result.output.join("\n")
      },
    },
    tooling: {
      ask: async (q: string) => {
        const result = await createToolingAgent(baseDeps).run(q)
        baseDeps.systemEvents.emit("agentMessage", {
          from: "tooling",
          to: "user",
          message: result.output.join("\n"),
        })
        return result.output.join("\n")
      },
    },
  }

  // Добавляем обработчик сообщений между агентами с проверкой типов
  baseDeps.systemEvents.on(
    "agentMessage",
    ({ from, to, message }: { from: string; to: string; message: string }) => {
      // Validate message structure
      if (typeof message !== "string" || message.trim() === "") {
        simpleLogger.error(`Invalid message from ${from} agent:`, message)
        return
      }

      if (to === "user") {
        simpleLogger.info(`${from} Agent → User:`, message)
        return
      }

      const targetAgent = agents[to as keyof typeof agents]
      if (!targetAgent) {
        simpleLogger.error(`Unknown agent target: ${to}`)
        return
      }

      simpleLogger.info(`${from} Agent → ${to} Agent:`, message)

      // Track message processing time
      const startTime = Date.now()
      targetAgent
        .ask(message)
        .then((response: unknown) => {
          if (typeof response !== "string") {
            throw new Error(
              `Agent ${to} returned invalid response type: ${typeof response}`
            )
          }

          simpleLogger.debug(
            `Agent ${to} processed message in ${Date.now() - startTime}ms`
          )
          baseDeps.systemEvents.emit("agentMessage", {
            from: to,
            to: from,
            message: response,
          })
        })
        .catch((err: Error) => {
          simpleLogger.error(
            `Error in agent ${to} communication (${Date.now() - startTime}ms):`,
            {
              message: err.message,
              stack: err.stack,
            }
          )
        })
    }
  )

  const agent = createOpenCodexAgent(agents)

  // Автоматический запуск диалога между агентами
  async function startAgentDialogue(
    initiator: keyof typeof agents,
    message: string
  ) {
    try {
      const response = await agents[initiator].ask(message)
      simpleLogger.info(`${initiator} Agent → All:`, response)

      // Рассылка ответа всем агентам
      for (const [agentName, agentObj] of Object.entries(agents)) {
        if (agentName !== initiator) {
          agentObj
            .ask(response)
            .then(reply => {
              simpleLogger.info(
                `${agentName} Agent → ${initiator} Agent:`,
                reply
              )
            })
            .catch(err => {
              simpleLogger.error(`Error in ${agentName} agent reply:`, err)
            })
        }
      }
    } catch (err) {
      simpleLogger.error(`Error in ${initiator} agent communication:`, err)
    }
  }

  simpleLogger.info(
    "Open Codex CLI. Введите вопрос или 'agentName: вопрос' для маршрутизации"
  )
  simpleLogger.info("Доступные агенты:", Object.keys(agents).join(", "))
  simpleLogger.info("Введите 'exit' для выхода\n")

  // Запускаем автоматический диалог между агентами
  startAgentDialogue("teamlead", "Начнем обсуждение задачи")

  let running = true
  while (running) {
    const question = await rl.question("You: ")
    if (question.toLowerCase() === "exit") {
      running = false
      continue
    }

    // Автономный режим работы
    if (question.toLowerCase() === "auto") {
      simpleLogger.info("Активирован автономный режим работы агентов")
      while (running) {
        // Автоматический выбор агента и генерация вопроса
        const agentNames = Object.keys(agents)
        const randomAgent =
          agentNames[Math.floor(Math.random() * agentNames.length)]
        const randomQuestion = `Вопрос от автономного режима: ${Math.random().toString(36).substring(7)}`

        try {
          const response =
            await agents[randomAgent as keyof typeof agents].ask(randomQuestion)
          simpleLogger.info(`${randomAgent} Agent:`, response)

          // Рассылка ответа другим агентам
          for (const [otherAgentName, otherAgent] of Object.entries(agents)) {
            if (otherAgentName !== randomAgent) {
              otherAgent
                .ask(response)
                .then(reply => {
                  simpleLogger.info(
                    `${otherAgentName} Agent → ${randomAgent} Agent:`,
                    reply
                  )
                })
                .catch(err => {
                  simpleLogger.error(
                    `Ошибка в автономном режиме агента ${otherAgentName}:`,
                    err
                  )
                })
            }
          }

          // Задержка между автономными запросами
          await new Promise(resolve => setTimeout(resolve, 5000))
        } catch (err) {
          simpleLogger.error(
            `Ошибка в автономном режиме агента ${randomAgent}:`,
            err
          )
        }
      }
      continue
    }

    // Проверяем формат 'agentName:message' для маршрутизации
    type AgentKey = keyof typeof agents

    if (question.includes(":")) {
      const [agentName, message] = question.split(":")
      const trimmedName = agentName.trim() as AgentKey
      if (
        trimmedName === "open-codex" ||
        trimmedName === "open_codex" ||
        trimmedName === "openCodex"
      ) {
        // Специальная обработка для общения с Open Codex агентом
        try {
          const response = await agent.ask(message.trim())
          simpleLogger.info("Open Codex Agent:", response)

          // Рассылка ответа всем агентам
          for (const [otherAgentName, otherAgent] of Object.entries(agents)) {
            otherAgent
              .ask(response)
              .then(reply => {
                simpleLogger.info(
                  `${otherAgentName} Agent → Open Codex Agent:`,
                  reply
                )
              })
              .catch(err => {
                simpleLogger.error(
                  `Error in ${otherAgentName} agent reply:`,
                  err
                )
              })
          }
        } catch (err) {
          simpleLogger.error(
            `Error in Open Codex agent communication: ${err instanceof Error ? err.message : String(err)}`
          )
        }
      } else if (agents[trimmedName]) {
        try {
          const response = await agents[trimmedName].ask(message.trim())
          simpleLogger.info(`${trimmedName} Agent:`, response)

          // Автоматическая рассылка ответа другим агентам
          for (const [otherAgentName, otherAgent] of Object.entries(agents)) {
            if (otherAgentName !== trimmedName) {
              otherAgent
                .ask(response)
                .then(reply => {
                  simpleLogger.info(
                    `${otherAgentName} Agent → ${trimmedName} Agent:`,
                    reply
                  )
                })
                .catch(err => {
                  simpleLogger.error(
                    `Error in ${otherAgentName} agent reply:`,
                    err
                  )
                })
            }
          }
        } catch (err: unknown) {
          const baseErrorMessage = `Error in ${trimmedName} agent communication: ${
            err instanceof Error ? err.message : String(err)
          }`
          simpleLogger.error(baseErrorMessage)
          if (
            err &&
            typeof err === "object" &&
            "response" in err &&
            err.response &&
            typeof err.response === "object" &&
            "data" in err.response &&
            err.response.data &&
            typeof err.response.data === "object" &&
            "error" in err.response.data &&
            err.response.data.error &&
            typeof err.response.data.error === "object" &&
            "message" in err.response.data.error &&
            typeof err.response.data.error.message === "string"
          ) {
            simpleLogger.error(`API Error: ${err.response.data.error.message}`)
          } else {
            // Optional: Log the whole error object if the structure is unexpected
            // simpleLogger.error("Full error object:", err);
          }
          throw new Error(baseErrorMessage)
        }
      } else {
        simpleLogger.error(`Unknown agent: ${trimmedName}`)
      }
    } else {
      const response = await agent.ask(question)
      simpleLogger.info("Open Codex Agent:", response)
    }
  }

  rl.close()
}

main().catch((err: unknown) => {
  simpleLogger.error(
    `Unhandled error in main function: ${
      err instanceof Error ? err.message : String(err)
    }`
  )
  process.exit(1)
})
