import type { Context } from "inngest"
import type { BaseLogger, AgentDependencies } from "@/types/agents"
import type { TddNetworkState } from "@/types/network"
import { NetworkStatus } from "@/types/network" // Потребуется для логики
import { type Network } from "@inngest/agent-kit" // Импортируем тип Network
import { HandlerStepName } from "@/types/handlerSteps"
import { runTypeCheckFunction } from "../functions/runTypeCheck" // Используем Inngest-функцию
import { runVitestFunction } from "../functions/runVitest" // Используем Inngest-функцию
import { processNetworkResult } from "./commonLogic" // Исправлен путь

// Импортируем необходимые типы и функции (будут уточняться по мере переноса логики)

interface TddCycleParams {
  initialState: Partial<TddNetworkState>
  agentDeps: AgentDependencies
  network: Network<TddNetworkState> // Используем Network<TddNetworkState>
  step: Context["step"]
  logger: BaseLogger
  validatedEventId: string
  initialTaskDescription: string
  sandboxId: string | undefined
  maxRevisionAttempts: number
}

export async function executeTddCycleLogic(
  params: TddCycleParams
): Promise<Partial<TddNetworkState>> {
  let finalState = { ...params.initialState } // Работаем с копией состояния
  let currentRevision = 0

  // Переменные для результатов шагов, чтобы избежать проблем с областью видимости
  let coderResult: any = null // Уточнить тип по NetworkRun
  let typeCheckResult: any = null // Уточнить тип по результату runTypeCheck
  let testRunResult: any = null // Уточнить тип по результату runVitest
  let criticResult: any = null // Уточнить тип по NetworkRun

  params.logger.info(
    `[executeTddCycleLogic] Starting with status: ${finalState.status}`,
    { eventId: params.validatedEventId }
  )

  // Сюда будет перенесен цикл main_loop из src/inngest/index.ts
  // --- Начало Блока для Переноса ---
  main_loop: while (currentRevision < params.maxRevisionAttempts) {
    currentRevision++
    params.logger.info(
      `[executeTddCycleLogic] Iteration ${currentRevision}/${params.maxRevisionAttempts}`,
      { eventId: params.validatedEventId, status: finalState.status }
    )

    // Логика для NEEDS_CODE и NEEDS_IMPLEMENTATION_REVISION (Coder)
    if (
      finalState &&
      finalState.status &&
      (finalState.status === NetworkStatus.Enum.NEEDS_CODE ||
        finalState.status === NetworkStatus.Enum.NEEDS_IMPLEMENTATION_REVISION)
    ) {
      params.logger.info(
        `[executeTddCycleLogic] Calling Coder (Revision ${currentRevision})`,
        { eventId: params.validatedEventId }
      )
      coderResult = await params.step.run(
        HandlerStepName.RUN_AGENT_NETWORK_CODER,
        async () => {
          return await params.network.run(
            `Coding task for event ${params.validatedEventId} - Revision cycle ${currentRevision}`
          )
        }
      )
      const processingResultCoder = await processNetworkResult(
        coderResult,
        params.step,
        params.logger,
        params.validatedEventId
      )
      finalState = processingResultCoder?.finalState || finalState
      params.logger.info(
        `[executeTddCycleLogic] After Coder, status: ${finalState.status}`,
        { eventId: params.validatedEventId, newState: finalState }
      )
    }

    // Логика для NEEDS_TYPE_CHECK
    if (
      finalState &&
      finalState.status === NetworkStatus.Enum.NEEDS_TYPE_CHECK
    ) {
      params.logger.info(`[executeTddCycleLogic] Calling Type Check`, {
        eventId: params.validatedEventId,
      })
      typeCheckResult = await params.step.invoke(
        HandlerStepName.INVOKE_TYPE_CHECK,
        {
          function: runTypeCheckFunction,
          data: {
            eventId: params.validatedEventId,
          },
        }
      )
      if (typeCheckResult && !typeCheckResult.success) {
        finalState.status = NetworkStatus.Enum.NEEDS_IMPLEMENTATION_REVISION
        finalState.critique = `Type check failed: ${typeCheckResult.errors}`
        params.logger.warn(`[executeTddCycleLogic] Type check failed`, {
          eventId: params.validatedEventId,
          errors: typeCheckResult.errors,
        })
        continue main_loop
      }
      finalState.status = NetworkStatus.Enum.NEEDS_TEST_CRITIQUE
      params.logger.info(
        `[executeTddCycleLogic] Type check OK, status: ${finalState.status}`,
        { eventId: params.validatedEventId }
      )
    }

    // Логика для NEEDS_TEST_CRITIQUE (Tester/Vitest)
    if (
      finalState &&
      finalState.status === NetworkStatus.Enum.NEEDS_TEST_CRITIQUE
    ) {
      params.logger.info(`[executeTddCycleLogic] Calling Tester (Vitest)`, {
        eventId: params.validatedEventId,
      })
      testRunResult = await params.step.invoke(
        HandlerStepName.INVOKE_RUN_TESTS,
        {
          function: runVitestFunction,
          data: {
            test_file_path: finalState.test_file_path,
            eventId: params.validatedEventId,
          },
        }
      )
      if (testRunResult && !testRunResult.success) {
        finalState.status = NetworkStatus.Enum.NEEDS_IMPLEMENTATION_REVISION
        finalState.critique = `Tests failed: ${testRunResult.summary}`
        params.logger.warn(`[executeTddCycleLogic] Tests failed`, {
          eventId: params.validatedEventId,
          summary: testRunResult.summary,
        })
        continue main_loop
      }
      finalState.status = NetworkStatus.Enum.NEEDS_IMPLEMENTATION_CRITIQUE
      params.logger.info(
        `[executeTddCycleLogic] Tests OK, status: ${finalState.status}`,
        { eventId: params.validatedEventId }
      )
    }

    // Логика для NEEDS_IMPLEMENTATION_CRITIQUE (Critic)
    if (
      finalState &&
      finalState.status === NetworkStatus.Enum.NEEDS_IMPLEMENTATION_CRITIQUE
    ) {
      params.logger.info(
        `[executeTddCycleLogic] Calling Critic (Revision ${currentRevision})`,
        { eventId: params.validatedEventId }
      )
      criticResult = await params.step.run(
        HandlerStepName.RUN_AGENT_NETWORK_CRITIC,
        async () => {
          return await params.network.run(
            `Critique task for event ${params.validatedEventId} - Revision cycle ${currentRevision}`
          )
        }
      )
      const processingResultCritic = await processNetworkResult(
        criticResult,
        params.step,
        params.logger,
        params.validatedEventId
      )
      finalState = processingResultCritic?.finalState || finalState
      params.logger.info(
        `[executeTddCycleLogic] After Critic, status: ${finalState.status}`,
        { eventId: params.validatedEventId, newState: finalState }
      )

      if (finalState.status === NetworkStatus.Enum.COMPLETED) {
        params.logger.info(
          `[executeTddCycleLogic] Cycle COMPLETED by Critic.`,
          { eventId: params.validatedEventId }
        )
        break main_loop
      }
      if (
        finalState.status !== NetworkStatus.Enum.NEEDS_IMPLEMENTATION_REVISION
      ) {
        params.logger.warn(
          `[executeTddCycleLogic] Unexpected status after Critic: ${finalState.status}. Breaking.`,
          { eventId: params.validatedEventId }
        )
        break main_loop // Выход, если статус не COMPLETED и не ревизия
      }
    }

    // Проверка на выход из цикла, если статус не предполагает активных действий в следующей итерации
    const canContinueLoop =
      finalState &&
      finalState.status &&
      (finalState.status === NetworkStatus.Enum.NEEDS_CODE ||
        finalState.status ===
          NetworkStatus.Enum.NEEDS_IMPLEMENTATION_REVISION ||
        finalState.status === NetworkStatus.Enum.NEEDS_TYPE_CHECK ||
        finalState.status === NetworkStatus.Enum.NEEDS_TEST_CRITIQUE ||
        finalState.status === NetworkStatus.Enum.NEEDS_IMPLEMENTATION_CRITIQUE)

    if (!canContinueLoop) {
      params.logger.warn(
        `[executeTddCycleLogic] Status ${finalState?.status} does not imply continuation at end of iteration ${currentRevision}. Breaking loop.`,
        { eventId: params.validatedEventId }
      )
      break main_loop
    }
  } // --- Конец Блока для Переноса ---

  if (
    currentRevision >= params.maxRevisionAttempts &&
    finalState.status !== NetworkStatus.Enum.COMPLETED
  ) {
    params.logger.warn(
      `[executeTddCycleLogic] Max revisions (${params.maxRevisionAttempts}) reached. Final status: ${finalState.status}`,
      { eventId: params.validatedEventId }
    )
    // Можно установить какой-то финальный статус ошибки, если не COMPLETED
    if (!finalState.error) {
      // Не перезаписываем существующую ошибку
      finalState.error = "Max revision attempts reached."
      // Можно также изменить статус на FAILED или подобный, если это предусмотрено
      // finalState.status = NetworkStatus.Enum.FAILED;
    }
  }

  params.logger.info(
    `[executeTddCycleLogic] Exiting. Final status: ${finalState.status}`,
    { eventId: params.validatedEventId }
  )
  return finalState
}
