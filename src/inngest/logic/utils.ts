/* eslint-disable */
import { Sandbox } from "@e2b/sdk"
// Убираем импорты типов из agent-kit, так как они не находятся
// import {
//   InferenceResult,
//   NetworkRun,
//   TextMessage,
//   Message,
//   TextPart,
// } from "@inngest/agent-kit";

// Cache for sandboxes - Not currently used
// const sandboxCache = new Map<string, Sandbox>()

// Function to retrieve a sandbox, potentially from cache
export type GetSandboxFunc = (sandboxId: string) => Promise<Sandbox | null>

export function lastAssistantTextMessageContent(
  result: any
): string | undefined {
  // Используем any
  const output = result?.output // Безопасный доступ
  if (!Array.isArray(output)) return undefined

  const lastAssistantMessageIndex = output.findLastIndex(
    (message: any) => message?.role === "assistant" // any
  )
  if (lastAssistantMessageIndex === -1) return undefined

  const message = output[lastAssistantMessageIndex]
  const content = message?.content

  return content
    ? typeof content === "string"
      ? content
      : Array.isArray(content)
        ? content.map((c: any) => c?.text).join("")
        : undefined // any + проверка
    : undefined
}

export async function getSandbox(sandboxId: string): Promise<Sandbox | null> {
  // Возвращаем null если ошибка
  try {
    const sandbox = await Sandbox.connect(sandboxId, {
      autoPause: true,
    })
    await sandbox.setTimeout(5 * 60_000)
    return sandbox
  } catch (error) {
    console.error(`Error connecting to sandbox ${sandboxId}:`, error)
    return null // Возвращаем null в случае ошибки
  }
}
