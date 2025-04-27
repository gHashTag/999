import { type Context } from "inngest"
import { type NetworkRun } from "@inngest/agent-kit"
import { type TddNetworkState, NetworkStatus } from "@/types/network"
import { HandlerLogger } from "@/types/agents"
import { runCodingAgent } from "@/inngest/index" // Corrected path

export async function processNetworkResult(
  networkResult: NetworkRun<TddNetworkState>,
  step: Context["step"],
  logger: HandlerLogger,
  eventId: string
): Promise<{ message: string; finalState: TddNetworkState } | undefined> {
  const finalStateFromKv = networkResult.state.kv.get("network_state") as
    | TddNetworkState
    | undefined

  logger.info(
    { step: "HANDLER_STATE_FROM_KV_RESULT" }, // TODO: Use HandlerStepName enum
    "State retrieved from network result KV.",
    {
      eventId: eventId, // Use passed eventId
      status: finalStateFromKv?.status,
      sandboxId: finalStateFromKv?.sandboxId,
    }
  )

  if (!finalStateFromKv) {
    logger.error(
      { step: "HANDLER_FINAL_STATE_MISSING" }, // TODO: Use HandlerStepName enum
      "Final state missing from network result KV.",
      { eventId }
    )
    // Return an error state or throw, depending on how the main handler should react
    throw new Error("Final state missing from network result KV.")
  }

  const finalState = finalStateFromKv // Use the retrieved state

  logger.info(
    { step: "FINAL_STATE_LOGGING" }, // TODO: Use HandlerStepName enum
    "Logging final state before processing.",
    { eventId, status: finalState.status, task: finalState.task }
  )
  logger.info(
    { step: "HANDLER_PROCESS_RESULT" }, // TODO: Use HandlerStepName enum
    "Processing network result.",
    {
      eventId,
      finalStatus: finalState.status,
      commandToExecute: finalState.command_to_execute,
    }
  )

  // --- Command Execution Logic ---
  if (finalState.status === NetworkStatus.Enum.NEEDS_COMMAND_EXECUTION) {
    const command = finalState.command_to_execute
    if (command && command.trim()) {
      logger.info(
        { step: "HANDLER_RUN_COMMAND" }, // TODO: Use HandlerStepName enum
        "Running command (currently stubbed)...",
        { eventId, command }
      )

      // Temporarily stub out E2B command execution <<<--- STUBBED BLOCK
      const commandOutput = await step.run(
        "execute-command-stubbed",
        async () => {
          logger.warn(
            { step: "E2B_STUBBED" }, // TODO: Use HandlerStepName enum
            "E2B command execution is currently stubbed.",
            { eventId }
          )
          return {
            stdout: "[STUBBED] Command output for: " + command,
            stderr: "",
            exitCode: 0,
          }
        }
      ) // <<<--- END OF STUBBED BLOCK

      logger.info(
        { step: "HANDLER_COMMAND_EXECUTED" }, // TODO: Use HandlerStepName enum
        "Command execution stubbed.",
        { eventId, exitCode: commandOutput.exitCode }
      )

      finalState.last_command_output = `Exit Code: ${commandOutput.exitCode}\n\nSTDOUT:\n${commandOutput.stdout}\n\nSTDERR:\n${commandOutput.stderr}`
      finalState.status = NetworkStatus.Enum.NEEDS_COMMAND_VERIFICATION
      finalState.command_to_execute = undefined

      logger.info(
        { step: "HANDLER_REINVOKE_AFTER_COMMAND" }, // TODO: Use HandlerStepName enum
        "Re-invoking handler after command.",
        { eventId, newStatus: finalState.status }
      )

      // Correct step.invoke structure: invoke(stepId, { function, data })
      // FIX: Remove the trailing comma here!
      await step.invoke(
        "reinvoke-handler-after-command", // Step ID (string)
        {
          // Options object
          function: runCodingAgent, // The function to invoke (imported)
          data: {
            // Data payload
            input: finalState.task,
            currentState: finalState,
          },
        } // NO COMMA HERE
      )
      // Indicate that the handler should return early after invoking
      return {
        message: "Command execution stubbed, re-invoked handler.",
        finalState,
      }
    } else {
      logger.warn(
        { step: "HANDLER_NO_COMMAND" }, // TODO: Use HandlerStepName enum
        "Status NEEDS_COMMAND_EXECUTION but command is empty.",
        { eventId }
      )
      finalState.status = NetworkStatus.Enum.FAILED
      // Let the main handler return this failed state
      return {
        message: "Command needed but was empty.",
        finalState,
      }
    }
  } else if (finalState.status === NetworkStatus.Enum.NEEDS_HUMAN_INPUT) {
    logger.info(
      { step: "HANDLER_HUMAN_INPUT_NEEDED" }, // TODO: Use HandlerStepName enum
      "Stopping for human input.",
      { eventId, finalStatus: finalState.status }
    )
    // Indicate that the handler should return early
    return {
      message: "Stopping for human input.",
      finalState,
    }
  } else {
    logger.info(
      { step: "HANDLER_NO_ACTION" }, // TODO: Use HandlerStepName enum
      "No further action needed by handler in this step.",
      { eventId, finalStatus: finalState.status }
    )
    // Indicate no special action needed, let the main handler complete normally
    return undefined
  }
}
