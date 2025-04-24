/* eslint-disable */
import { Sandbox } from "@e2b/code-interpreter";
// Убираем импорты типов из agent-kit, так как они не находятся
// import {
//   InferenceResult,
//   NetworkRun,
//   TextMessage,
//   Message,
//   TextPart,
// } from "@inngest/agent-kit";
export function lastAssistantTextMessageContent(result) {
    const output = result?.output; // Безопасный доступ
    if (!Array.isArray(output))
        return undefined;
    const lastAssistantMessageIndex = output.findLastIndex((message) => message?.role === "assistant" // any
    );
    if (lastAssistantMessageIndex === -1)
        return undefined;
    const message = output[lastAssistantMessageIndex];
    const content = message?.content;
    return content
        ? typeof content === "string"
            ? content
            : Array.isArray(content) ? content.map((c) => c?.text).join("") : undefined // any + проверка
        : undefined;
}
export async function getSandbox(sandboxId) {
    try {
        const sandbox = await Sandbox.connect(sandboxId);
        await sandbox.setTimeout(5 * 60_000);
        return sandbox;
    }
    catch (error) {
        console.error(`Error connecting to sandbox ${sandboxId}:`, error);
        return null; // Возвращаем null в случае ошибки
    }
}
//# sourceMappingURL=utils.js.map