import { type Context } from "inngest"
import { type TddNetworkState, NetworkStatus } from "@/types/network"
import { HandlerLogger } from "@/types/agents"
import { runCodingAgent } from "@/inngest/index"

// Define a type for the expected result of the network run step
type NetworkRunStepResult = any

export async function processNetworkResult(
  networkResult: NetworkRunStepResult,
  step: Context["step"],
  logger: HandlerLogger,
  eventId: string
): Promise<{ message: string; finalState: TddNetworkState } | undefined> {
  const finalStateFromKv = (await networkResult?.state?.kv?.get(
    "network_state"
  )) as TddNetworkState | undefined

  logger.info("State retrieved from network result KV.", {
    eventId: eventId,
    status: finalStateFromKv?.status,
    sandboxId: finalStateFromKv?.sandboxId,
  })

  if (!finalStateFromKv) {
    logger.error("Final state missing from network result KV.", { eventId })
    throw new Error("Final state missing from network result KV.")
  }

  const finalState = finalStateFromKv

  logger.info("Logging final state before processing.", {
    eventId,
    status: finalState.status,
    task: finalState.task,
  })
  logger.info("Processing network result.", {
    eventId,
    finalStatus: finalState.status,
    commandToExecute: finalState.command_to_execute,
  })

  // --- Command Execution Logic ---
  if (finalState.status === NetworkStatus.Enum.NEEDS_COMMAND_EXECUTION) {
    const command = finalState.command_to_execute
    if (command && command.trim()) {
      logger.info("Running command (currently stubbed)...", {
        eventId,
        command,
      })

      const commandOutput = await step.run(
        "execute-command-stubbed",
        async () => {
          logger.warn("E2B command execution is currently stubbed.", {
            eventId,
          })
          return {
            stdout: "[STUBBED] Command output for: " + command,
            stderr: "",
            exitCode: 0,
          }
        }
      )

      logger.info("Command execution stubbed.", {
        eventId,
        exitCode: commandOutput.exitCode,
      })

      finalState.last_command_output = `Exit Code: ${commandOutput.exitCode}\n\nSTDOUT:\n${commandOutput.stdout}\n\nSTDERR:\n${commandOutput.stderr}`
      finalState.status = NetworkStatus.Enum.NEEDS_COMMAND_VERIFICATION
      finalState.command_to_execute = undefined

      logger.info("Re-invoking handler after command.", {
        eventId,
        newStatus: finalState.status,
      })

      await step.invoke("reinvoke-handler-after-command", {
        function: runCodingAgent,
        data: {
          input: finalState.task,
          currentState: finalState,
        },
      })
      return {
        message: "Command execution stubbed, re-invoked handler.",
        finalState,
      }
    } else {
      logger.warn("Status NEEDS_COMMAND_EXECUTION but command is empty.", {
        eventId,
      })
      finalState.status = NetworkStatus.Enum.FAILED
      return {
        message: "Command needed but was empty.",
        finalState,
      }
    }
  } else if (finalState.status === NetworkStatus.Enum.NEEDS_HUMAN_INPUT) {
    logger.info("Stopping for human input.", {
      eventId,
      finalStatus: finalState.status,
    })
    return {
      message: "Stopping for human input.",
      finalState,
    }
  } else {
    logger.info("No further action needed by handler in this step.", {
      eventId,
      finalStatus: finalState.status,
    })
    return undefined
  }
}
