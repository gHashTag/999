import { type Context } from "inngest"
import { Sandbox } from "@e2b/sdk"
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
  logger.info("Checking sandbox status...", {
    step: HandlerStepName.SANDBOX_CHECK_START,
    sandboxId: currentSandboxId,
    eventId,
  })

  if (!currentSandboxId) {
    logger.info("No sandbox ID found, creating new sandbox step.", {
      step: HandlerStepName.GET_SANDBOX_ID_START,
      eventId,
    })
    const newSandboxId = await step.run(
      HandlerStepName.CREATE_SANDBOX_STEP_END,
      async () => {
        logger.info("Creating new E2B sandbox...", {
          step: HandlerStepName.CREATE_SANDBOX_STEP_START,
        })
        const sandbox = await Sandbox.create("base")
        const createdId = sandbox.sandboxId
        logger.info(`Sandbox created successfully with ID: ${createdId}`, {
          step: HandlerStepName.CREATE_SANDBOX_STEP_END,
          newSandboxId: createdId,
        })
        return createdId
      }
    )
    currentSandboxId = newSandboxId
    logger.info(`Retrieved new sandbox ID: ${currentSandboxId}`, {
      step: HandlerStepName.GET_SANDBOX_ID_END,
      eventId,
      sandboxId: currentSandboxId,
    })
  } else {
    logger.info(`Using existing sandbox ID: ${currentSandboxId}`, {
      step: HandlerStepName.GET_SANDBOX_ID_END,
      eventId,
      sandboxId: currentSandboxId,
    })
  }
  logger.info("Sandbox check complete.", {
    step: HandlerStepName.SANDBOX_CHECK_END,
    sandboxId: currentSandboxId,
    eventId,
  })

  if (!currentSandboxId) {
    throw new Error("Sandbox ID missing after creation attempt.")
  }
  return currentSandboxId
}

export const getSandbox = async (sandboxId: string): Promise<Sandbox> => {
  const idToConnect = process.env.SANDBOX_ID ?? sandboxId
  const sandbox = await Sandbox.connect(idToConnect)
  return sandbox
}
