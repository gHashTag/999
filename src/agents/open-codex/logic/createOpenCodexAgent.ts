export function createOpenCodexAgent(
  agents: Record<string, { ask: (q: string) => Promise<string> }>,
  deps?: { log: { error: (msg: string) => void } }
) {
  return {
    ask: async (question: string): Promise<string> => {
      // Простая маршрутизация по префиксу "agentName:"
      const [agentName, ...rest] = question.split(":")
      const trimmedName = agentName.trim()

      if (agents[trimmedName]) {
        try {
          const response = await agents[trimmedName].ask(rest.join(":").trim())

          // Broadcast response to other agents
          await Promise.all(
            Object.entries(agents)
              .filter(([name]) => name !== trimmedName)
              .map(([, agent]) => agent.ask(response))
          )

          return response
        } catch (error) {
          const errorMessage = `Error processing agent ${trimmedName}: ${error}`
          const logger = deps?.log || console
          logger.error(errorMessage)
          return errorMessage
        }
      }

      const errorMessage = `Unknown agent: ${trimmedName}`
      const logger = deps?.log || console
      logger.error(errorMessage)
      return `Я Open Codex. ${errorMessage}`
    },
  }
}
