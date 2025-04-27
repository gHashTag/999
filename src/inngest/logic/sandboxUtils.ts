import { type Context } from "inngest"
import { Sandbox } from "e2b"
import { TddNetworkState } from "@/types/network"
import { HandlerLogger } from "@/types/agents"
import { HandlerStepName } from "@/types/handlerSteps"

export async function ensureSandboxId(
  currentState: TddNetworkState | undefined,
  step: Context["step"],
  logger: HandlerLogger,
  eventId: string
): Promise<string> {
  let currentSandboxId: string | null | undefined = currentState?.sandboxId
  logger.info(
    { step: HandlerStepName.SANDBOX_CHECK_START },
    "Checking for existing sandbox ID.",
    { eventId }
  )

  if (!currentSandboxId) {
    logger.info(
      { step: HandlerStepName.GET_SANDBOX_ID_START },
      "No sandbox ID, creating new.",
      { eventId }
    )
    const newSandboxId = await step.run("get-sandbox-id", async () => {
      logger.info(
        { step: HandlerStepName.CREATE_SANDBOX_STEP_START },
        "Creating sandbox...",
        { eventId }
      )
      // Убираем autoPause, т.к. вызывает ошибку типа
      const sandbox = await Sandbox.create()
      logger.info(
        { step: HandlerStepName.CREATE_SANDBOX_STEP_END },
        "Sandbox created.",
        {
          eventId,
          newSandboxId: sandbox.sandboxId,
        }
      )
      return sandbox.sandboxId
    })
    currentSandboxId = newSandboxId
    logger.info(
      { step: HandlerStepName.GET_SANDBOX_ID_END },
      "Got new sandbox ID.",
      {
        eventId,
        sandboxId: currentSandboxId,
      }
    )
  } else {
    logger.info(
      { step: HandlerStepName.GET_SANDBOX_ID_SKIP },
      "Reusing existing sandbox ID.",
      { eventId, sandboxId: currentSandboxId }
    )
  }
  logger.info(
    { step: HandlerStepName.SANDBOX_CHECK_END },
    "Finished sandbox ID check.",
    {
      eventId,
      sandboxId: currentSandboxId,
    }
  )

  if (!currentSandboxId) {
    throw new Error("Sandbox ID missing after creation attempt.")
  }
  return currentSandboxId
}
