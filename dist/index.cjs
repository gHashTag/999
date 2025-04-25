'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const Fastify = require('fastify');
const fastify = require('inngest/fastify');
const codeInterpreter = require('@e2b/code-interpreter');
require('dotenv/config');
const inngest$1 = require('inngest');
const zod = require('zod');
const http = require('node:http');
const express = require('inngest/express');
const node_url = require('node:url');

var _documentCurrentScript = typeof document !== 'undefined' ? document.currentScript : null;
// FIX: Remove problematic import
// import { sandboxId } from "../index.js"; // Assuming sandboxId is accessible globally or passed differently
// TODO: Improve how sandboxId is accessed. Maybe pass it to the log function?
// Define a type for the optional data payload
// interface LogData {
//   sandboxId?: string | null;
//   [key: string]: unknown; // Allow other properties
// }
/**
 * Helper for structured logging.
 * @param level - Log level ('info', 'warn', 'error')
 * @param stepName - Name of the step/context
 * @param message - Log message
 * @param data - Additional data object (optional)
 */ const log = (level, stepName, message, data = {} // Revert back to object
)=>{
    // Access sandboxId safely from the typed data object
    const currentSandboxId = data.sandboxId || null // Keep the `any` assertion for now
    ;
    console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level,
        step: stepName,
        sandboxId: currentSandboxId,
        message,
        ...data
    }, null, 2 // Pretty print JSON
    ));
};

// Define the main event payload schema
const codingAgentEventSchema = zod.z.object({
    input: zod.z.string()
});

// Initialize Inngest Client
const inngest = new inngest$1.Inngest({
    id: "agentkit-tdd-agent"
});
// Define getSandbox function locally using step context if needed elsewhere, or keep encapsulated
// export const getSandbox = ... // If needed externally
// --- Main Handler --- //
// FIX: Accept the full context object and destructure inside
async function codingAgentHandler({ event, step }) {
    // Log the event and step objects to check if they are passed correctly
    log("info", "HANDLER_DEBUG_CONTEXT", "Handler invoked", {
        eventId: event === null || event === void 0 ? void 0 : event.id,
        isEventDefined: !!event,
        isStepDefined: !!step,
        stepKeys: step ? Object.keys(step) : null
    });
    if (!step) {
        log("error", "STEP_UNDEFINED_DEBUG", "Step object is undefined inside handler!", {
            eventId: event === null || event === void 0 ? void 0 : event.id
        });
        // Avoid throwing here during debug to see if the log appears
        return {
            error: "Step context was undefined."
        };
    }
    // Validate event data using the schema
    // FIX: Add back schema validation
    const validatedData = codingAgentEventSchema.safeParse(event.data);
    if (!validatedData.success) {
        log("error", "HANDLER_START", "Invalid event data.", {
            eventId: event === null || event === void 0 ? void 0 : event.id,
            isEventDefined: !!event,
            isStepDefined: !!step,
            stepKeys: step ? Object.keys(step) : null
        });
        return {
            error: "Invalid event data."
        };
    }
    try {
        const eventId = event.id;
        if (!eventId) {
            throw new Error("Event ID is missing after validation.");
        }
        // const taskInput = validatedData.data.input // Закомментировано временно
        log("info", "GET_SANDBOX_ID_START", "Getting sandbox ID...", {
            eventId
        });
        const sandboxId = await step.run("get-sandbox-id", async ()=>{
            log("info", "CREATE_SANDBOX_STEP_START", "Creating sandbox...", {
                eventId
            });
            const sandbox = await codeInterpreter.Sandbox.create();
            log("info", "CREATE_SANDBOX_STEP_END", "Sandbox created.", {
                eventId,
                newSandboxId: sandbox.sandboxId
            });
            return sandbox.sandboxId;
        });
        log("info", "GET_SANDBOX_ID_END", "Got sandbox ID.", {
            eventId,
            sandboxId
        });
        // TEMPORARY getSandboxForTools - needs fixing if tools need sandbox instance
        // const getSandboxForTools = async (): Promise<Sandbox | null> => {
        //   log("warn", "TEMP_HACK", "Providing null sandbox to tools", { eventId })
        //   return null // Provide null for now
        // }
        log("info", "CREATE_TOOLS_START", "Creating tools...", {
            eventId,
            sandboxId
        });
        // const allTools = getAllTools(log, getSandboxForTools, eventId, sandboxId) // Закомментировано временно
        log("info", "CREATE_TOOLS_END", "Tools created.", {
            eventId,
            sandboxId
        });
        log("info", "CREATE_AGENTS_START", "Creating agents...", {
            eventId,
            sandboxId
        });
        /* // Закомментировано временно
    const agentDeps: AgentDependencies = {
      allTools,
      log,
      apiKey: process.env.DEEPSEEK_API_KEY!,
      modelName: process.env.DEEPSEEK_MODEL || "deepseek-coder",
    }
    const testerAgent = createTesterAgent(agentDeps)
    const codingAgent = createCodingAgent(agentDeps)
    const criticAgent = createCriticAgent(agentDeps)
    */ log("info", "CREATE_AGENTS_END", "Agents created.", {
            eventId,
            sandboxId
        });
        // ВРЕМЕННО КОММЕНТИРУЕМ СОЗДАНИЕ СЕТИ ДЛЯ ТЕСТА ЗАПУСКА СЕРВЕРА
        /*
    const devOpsNetwork = createDevOpsNetwork(
      testerAgent,
      codingAgent,
      criticAgent
    )
    */ log("info", "NETWORK_RUN_START", "Running DevOps network step...", {
            eventId,
            sandboxId
        });
        // ВРЕМЕННО КОММЕНТИРУЕМ ЗАПУСК СЕТИ
        /*
    const networkResult = await step.run("run-devops-network", async () => {
      try {
        log(
          "info",
          "NETWORK_RUN_INTERNAL_START",
          "Calling devOpsNetwork.run()...",
          { eventId, sandboxId }
        )
        const result = await devOpsNetwork.run(taskInput) // Pass taskInput
        log(
          "info",
          "NETWORK_RUN_INTERNAL_END",
          "DevOps network finished internally.",
          {
            eventId,
            sandboxId,
            internalResultStructure: result ? Object.keys(result) : null,
          }
        )
        return result
      } catch (networkError: any) {
        log(
          "error",
          "NETWORK_RUN_INTERNAL_ERROR",
          "Error occurred inside devOpsNetwork.run()",
          {
            eventId,
            sandboxId,
            error: networkError.message,
            stack: networkError.stack,
          }
        )
        // Re-throw the error to let step.run handle retries if configured
        throw networkError
      }
    })
    */ const networkResult = {
            info: "Network run skipped for server start test"
        } // Placeholder
        ;
        log("info", "NETWORK_RUN_STEP_END", "DevOps network step skipped.", {
            eventId,
            sandboxId
        });
        // --- Debug: Inspect networkResult structure --- //
        log("info", "DEBUG_NETWORK_RESULT", "Inspecting networkResult...", {
            eventId,
            networkResult: networkResult
        });
        // --- Read Final State for Logging/Cleanup --- //
        const finalStateForLogging = networkResult// Cast to any for now
        ;
        // TODO: Restore state handling logic based on DEBUG_NETWORK_RESULT log
        // Return the final state obtained
        return {
            finalState: finalStateForLogging
        } // Return the result
        ;
    } catch (error) {
        log("error", "HANDLER_ERROR", "An error occurred in the main handler.", {
            eventId: event === null || event === void 0 ? void 0 : event.id
        });
        // Ensure catch block also returns something consistent if needed, or rethrows
        // For now, return an error structure
        return {
            error: `Handler failed: ${error instanceof Error ? error.message : String(error)}`
        };
    } // End try-catch
}
// Define the function before exporting it.
const codingAgentFunction = inngest.createFunction({
    id: "coding-agent-tdd-function",
    name: "TDD Coding Agent Function"
}, {
    event: "coding-agent/run"
}, codingAgentHandler // Use the handler function defined above
);
const PORT = 8484 // Должен совпадать с APP_SERVER_URL в тесте
;
// Создаем базовый HTTP сервер
const server = http.createServer((req, res)=>{
    // Обрабатываем запросы к Inngest endpoint
    if (req.url === "/api/inngest" && req.method === "POST") {
        log("info", "HTTP_SERVER", "Received request for /api/inngest");
        // Используем Inngest serve handler для обработки
        // Передаем объекты как есть, так как они совместимы
        express.serve({
            client: inngest,
            functions: [
                codingAgentFunction
            ]
        })(req, res);
    } else {
        // Отвечаем на другие запросы (например, для waitForUrl)
        res.writeHead(200, {
            "Content-Type": "text/plain"
        });
        res.end("OK");
    }
});
// Запускаем сервер
server.listen(PORT, ()=>{
    log("info", "HTTP_SERVER_START", `Minimal HTTP server listening on port ${PORT}`);
});
server.on("error", (error)=>{
    log("error", "HTTP_SERVER_ERROR", `Server error: ${error.message}`);
// В реальном приложении здесь может быть более сложная обработка ошибок
}) // --- Utils related to Inngest ---
 // We might keep the getSandbox util here or move it.
 // Let's assume it's in ./logic/utils for now as originally intended.
 // export { getSandbox } from "./logic/utils"; // Re-export if needed
;

// --- HTTP Server (Entry Point using Fastify) --- //
// Create Fastify instance with explicit type
const app = Fastify({
    logger: false
});
// Serve the Inngest function(s) using the plugin
app.register(fastify.fastifyPlugin, {
    client: inngest,
    functions: [
        codingAgentFunction
    ]
});
const APP_PORT = parseInt(process.env.APP_PORT || "8484", 10) // Ensure port is number
;
// Define the start function
const start = async ()=>{
    try {
        await app.listen({
            port: APP_PORT,
            host: "0.0.0.0"
        });
        log("info", "SERVER_START", `Fastify server listening on http://localhost:${APP_PORT}/api/inngest`, {
            port: APP_PORT
        });
    } catch (err) {
        log("error", "SERVER_ERROR", "Error starting Fastify server", {
            error: err.message
        });
        process.exit(1);
    }
};
// Only start the server if not in a test environment AND this file is run directly
if (process.env.NODE_ENV !== "test" && (typeof document === 'undefined' ? require('u' + 'rl').pathToFileURL(__filename).href : (_documentCurrentScript && _documentCurrentScript.tagName.toUpperCase() === 'SCRIPT' && _documentCurrentScript.src || new URL('index.cjs', document.baseURI).href)) === node_url.pathToFileURL(process.argv[1]).href) {
    start();
}

exports.app = app;
exports.start = start;
