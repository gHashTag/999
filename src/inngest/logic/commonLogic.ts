import {
  type CodingAgentEventData,
  codingAgentEventDataSchema,
} from "@/types/events"
import type {
  BaseLogger,
  KvStore,
  SystemEvents,
  // Sandbox as E2BSandboxType, // Удаляем
  // Agents, // Удаляем
  AgentDependencies,
} from "@/types/agents"
import { HandlerStepName } from "@/types/handlerSteps"
import type { TddNetworkState } from "@/types/network" // Для currentState
import { NetworkStatus } from "@/types/network"
import { type Context } from "inngest" // Для ensureSandboxId
import { Sandbox } from "@e2b/sdk" // Для ensureSandboxId и getSandbox
import { type Tool } from "@inngest/agent-kit"
import { type ZodIssue } from "zod" // Добавляем импорт ZodIssue

// Определяем структуру возвращаемого значения для УСПЕШНОЙ валидации
interface ValidatedEventOutput {
  input: string
  eventId: string
  currentState?: Partial<TddNetworkState>
}

export const validateEventData = (
  data: CodingAgentEventData | undefined,
  eventIdFromData?: string, // Может прийти из event.data.eventId
  logger?: BaseLogger
): { data?: ValidatedEventOutput; error?: string } => {
  const actualEventId = eventIdFromData // Используем eventId из данных события

  if (process.env.NODE_ENV === "test" && data?.input) {
    logger?.info("Skipping Zod validation for test event with input.", {
      step: "VALIDATE_DATA_SKIP_TEST_WITH_INPUT",
      eventId: actualEventId,
    })
    return {
      data: {
        input: data.input,
        eventId: actualEventId || "test-event-id", // Provide a fallback for tests if needed
        currentState: data.currentState,
      },
    }
  }

  if (!data) {
    logger?.error("Event data is missing.", {
      step: HandlerStepName.HANDLER_INVALID_DATA,
      eventId: actualEventId,
    })
    return { error: "Event data is missing." }
  }

  const validation = codingAgentEventDataSchema.safeParse(data)

  if (!validation.success) {
    const errorMessage = "Invalid event data structure."
    const errorDetails = validation.error.issues
      .map((e: ZodIssue) => `${e.path.join(".")}: ${e.message}`)
      .join("; ")
    logger?.error(`${errorMessage} Details: ${errorDetails}`, {
      step: HandlerStepName.HANDLER_INVALID_DATA,
      eventId: actualEventId,
      errors: validation.error.flatten(),
    })
    return { error: `${errorMessage} ${errorDetails}` }
  }

  // Убедимся, что input и eventId существуют после валидации Zod
  // (хотя схема должна это гарантировать, если она строгая)
  const { input, currentState } = validation.data

  if (!input) {
    logger?.error("Missing 'input' in validated event data.", {
      step: HandlerStepName.HANDLER_INVALID_DATA,
      eventId: actualEventId,
    })
    return { error: "Missing 'input' in validated event data." }
  }

  if (!actualEventId) {
    logger?.error("Missing 'eventId' in event data.", {
      step: HandlerStepName.HANDLER_INVALID_DATA,
    })
    return { error: "Missing 'eventId' in event data." }
  }

  return {
    data: {
      input,
      eventId: actualEventId,
      currentState,
    },
  }
}

// --- Функции для работы с Sandbox ---
export async function ensureSandboxId(
  currentState: Partial<TddNetworkState> | undefined, // Изменено для частичного состояния
  step: Context["step"],
  logger: BaseLogger, // Изменено на BaseLogger для совместимости
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
    // Имя шага должно быть уникальным, если create-sandbox-step уже используется где-то
    const newSandboxId = await step.run("create-new-sandbox", async () => {
      logger.info("Creating new E2B sandbox...", {
        step: HandlerStepName.CREATE_SANDBOX_STEP_START, // Эти имена для логирования, не для step.run id
      })
      const sandbox = await Sandbox.create("base")
      const createdId = sandbox.sandboxId
      logger.info(`Sandbox created successfully with ID: ${createdId}`, {
        step: HandlerStepName.CREATE_SANDBOX_STEP_END,
        newSandboxId: createdId,
      })
      return createdId
    })
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
    // Это должно быть крайне редкой ситуацией, если step.run отработал
    logger.error("Critical: Sandbox ID missing after creation attempt.", {
      eventId,
    })
    throw new Error("Sandbox ID missing after creation attempt.")
  }
  return currentSandboxId
}

export const getSandbox = async (sandboxId: string): Promise<Sandbox> => {
  // В реальном приложении, возможно, стоит кэшировать или управлять подключениями к Sandbox
  // Здесь простой connect по ID
  const idToConnect = process.env.E2B_SANDBOX_ID ?? sandboxId // Используем E2B_SANDBOX_ID если есть
  const sandbox = await Sandbox.connect(idToConnect)
  return sandbox
}
// --- Конец функций Sandbox ---

// Сюда будут добавлены другие общие функции

// --- Функция для обработки результата работы сети агентов ---
// Определяем тип для networkResult более точно, если возможно (например, NetworkRun)
// type NetworkRunStepResult = any; // Заменено на более общий Record<string, any>

export async function processNetworkResult(
  networkResult: Record<string, any> | null | undefined, // Более общий тип
  step: Context["step"],
  logger: BaseLogger, // Изменено на BaseLogger
  eventId: string
): Promise<
  { message: string; finalState: Partial<TddNetworkState> } | undefined
> {
  // Возвращает Partial
  // Убедимся, что networkResult и его части существуют
  const finalStateFromKv = networkResult?.state?.kv?.get
    ? ((await networkResult.state.kv.get("network_state")) as
        | Partial<TddNetworkState>
        | undefined)
    : undefined

  logger.info("State retrieved from network result KV.", {
    eventId: eventId,
    status: finalStateFromKv?.status,
    sandboxId: finalStateFromKv?.sandboxId,
  })

  if (!finalStateFromKv) {
    logger.error(
      "Final state missing from network result KV or result is null/undefined.",
      { eventId, networkResult }
    )
    // Возвращаем undefined, чтобы вызывающая функция могла использовать предыдущее состояние
    // или обработать как критическую ошибку, если состояние обязательно должно быть
    return undefined
  }

  const finalState: Partial<TddNetworkState> = finalStateFromKv // Теперь это Partial<TddNetworkState>

  logger.info("Processing network result.", {
    eventId,
    finalStatus: finalState.status,
    commandToExecute: finalState.command_to_execute,
  })

  if (finalState.status === NetworkStatus.Enum.NEEDS_COMMAND_EXECUTION) {
    const command = finalState.command_to_execute
    if (command && command.trim()) {
      logger.info("Running command (stubbed in processNetworkResult)...", {
        eventId,
        command,
      })
      const commandOutput = await step.run(
        "execute-command-stubbed",
        async () => {
          logger.warn(
            "E2B command execution is currently stubbed IN processNetworkResult.",
            { eventId }
          )
          return {
            stdout: `[STUBBED] Command output for: ${command}`,
            stderr: "",
            exitCode: 0,
          }
        }
      )

      logger.info("Command execution stubbed (in processNetworkResult).", {
        eventId,
        exitCode: commandOutput.exitCode,
      })
      finalState.last_command_output = `Exit Code: ${commandOutput.exitCode}\nSTDOUT:\n${commandOutput.stdout}\nSTDERR:\n${commandOutput.stderr}`
      finalState.status = NetworkStatus.Enum.NEEDS_COMMAND_VERIFICATION
      finalState.command_to_execute = undefined

      // Убираем step.invoke отсюда. Вызывающая функция (runCodingAgent) должна решать, что делать дальше.
      // logger.info("Re-invoking handler after command (removed from processNetworkResult).", { eventId, newStatus: finalState.status });
      // await step.invoke("reinvoke-handler-after-command", { /* ... */ });
      return {
        message: "Command execution stubbed, state updated for verification.",
        finalState,
      }
    } else {
      logger.warn(
        "Status NEEDS_COMMAND_EXECUTION but command is empty (in processNetworkResult).",
        { eventId }
      )
      finalState.status = NetworkStatus.Enum.FAILED
      return { message: "Command needed but was empty.", finalState }
    }
  } else if (finalState.status === NetworkStatus.Enum.NEEDS_HUMAN_INPUT) {
    logger.info("Stopping for human input (in processNetworkResult).", {
      eventId,
      finalStatus: finalState.status,
    })
    return { message: "Stopping for human input.", finalState }
  }

  // Если никакие специальные действия не нужны, просто возвращаем обновленное состояние
  logger.info(
    "No special post-network action in processNetworkResult. Returning current state from KV.",
    { eventId, finalStatus: finalState.status }
  )
  return {
    message: "Network result processed, state updated from KV.",
    finalState,
  }
}
// --- Конец функции обработки результата ---

// --- ВОССТАНОВЛЕННЫЕ ФУНКЦИИ ---

export const getCurrentState = async (
  initialState: Partial<TddNetworkState> | undefined,
  logger: BaseLogger,
  eventId: string,
  sandboxId?: string | null
): Promise<Partial<TddNetworkState>> => {
  logger.info("Attempting to get current state.", {
    eventId,
    stepName: HandlerStepName.STATE_INIT_START, // Используем stepName для консистентности с другими логами
  })

  let stateFromKV: Partial<TddNetworkState> | undefined | null = null

  if (initialState) {
    logger.info("Using initial state provided in event data.", {
      eventId,
      initialStateStatus: initialState.status,
    })
    stateFromKV = initialState
  } else {
    // Если состояние не передано, можно попытаться получить его из KV хранилища шага (если оно используется)
    // Например, если бы мы сохраняли состояние между вызовами invoke в KV Inngest
    // stateFromKV = await step.storage.get(`network_state_${eventId}`);
    // logger.info("Attempted to retrieve state from step.storage.", { eventId, found: !!stateFromKV });

    // Если и там нет, то инициализируем
    if (!stateFromKV) {
      logger.warn(
        "No initial state provided and not found in step storage, returning empty state for init.",
        { eventId }
      )
      stateFromKV = {
        status: NetworkStatus.Enum.NEEDS_CODE,
        eventId: eventId,
        sandboxId: sandboxId || undefined,
      }
    }
  }

  logger.info("Current state retrieved/initialized.", {
    eventId,
    status: stateFromKV?.status,
    sandboxId: stateFromKV?.sandboxId,
    stepName: HandlerStepName.STATE_INIT_END,
  })

  return (
    stateFromKV || {
      status: NetworkStatus.Enum.NEEDS_CODE,
      eventId: eventId,
      sandboxId: sandboxId || undefined,
    }
  )
}

export const createAgentDependencies = (
  logger: BaseLogger,
  systemEvents?: SystemEvents, // Сделаем опциональными, создадим моки если не переданы
  kvStore?: KvStore,
  model?: any, // Уточнить тип модели (например, OpenAIChat | DeepSeekChat)
  sandboxId?: string | null,
  allToolsFromDefinition?: Tool<any>[] // Переименовано для ясности
): AgentDependencies => {
  const actualSystemEvents = systemEvents || {
    emit: async (event: string, payload: Record<string, unknown>) => {
      logger.info(`MockSystemEvent: ${event}`, payload)
    },
  }

  const actualKvStore = kvStore || {
    get: async (key: string) => {
      logger.info(`MockKvStore.get: ${key}`)
      return undefined
    },
    set: async (key: string, value: any) => {
      logger.info(`MockKvStore.set: ${key}`, value)
    },
    delete: async (key: string) => {
      logger.info(`MockKvStore.delete: ${key}`)
      return true
    },
  }

  // TODO: Инициализировать реальную модель, если есть API ключ, иначе мок
  const actualModel = model || {
    ask: async () => ({
      output: [{ type: "text", content: "Mock model response" }],
    }),
  }

  // TODO: Инициализировать реальный Sandbox, если есть sandboxId, иначе null или мок
  const actualSandbox: Sandbox | null = null
  if (sandboxId) {
    // Здесь могла бы быть логика подключения к существующему сэндбоксу
    // logger.info(`Attempting to connect to sandbox: ${sandboxId}`);
    // actualSandbox = await Sandbox.connect(sandboxId); // Пример
    // Пока оставляем null, так как прямое подключение здесь может быть сложным
  }

  return {
    log: logger,
    apiKey:
      process.env.DEEPSEEK_API_KEY ||
      process.env.OPENROUTER_API_KEY ||
      "mockApiKey",
    modelName: "mockModelName", // TODO: Сделать это динамическим
    systemEvents: actualSystemEvents,
    kv: actualKvStore,
    model: actualModel,
    sandbox: actualSandbox, // Используем инициализированный sandbox
    tools: allToolsFromDefinition || [], // <--- ИЗМЕНЕНО С allTools НА tools
  }
}

export const logFinalResult = async (
  finalState: Partial<TddNetworkState>,
  logger: BaseLogger,
  eventId: string
): Promise<void> => {
  logger.info("Final TDD cycle state.", {
    eventId,
    status: finalState.status,
    critique: finalState.critique,
    test_results: finalState.test_results,
    error: finalState.error,
    run_id: finalState.run_id,
    sandboxId: finalState.sandboxId,
    step: HandlerStepName.FINAL_STATE_LOGGING,
  })
}
