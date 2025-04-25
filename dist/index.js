/* eslint-disable */
import "dotenv/config";
import { Inngest } from "inngest";
import { getSandbox } from "./inngest/utils.js";
import { Sandbox } from "@e2b/code-interpreter";
import { createDevOpsNetwork } from "./network.js";
import { getAllTools } from "./toolDefinitions.js";
import { createTesterAgent, createCodingAgent, createCriticAgent, } from "./agentDefinitions.js";
// Initialize Inngest Client
const inngest = new Inngest({ id: "agentkit-tdd-agent" });
// Helper for structured logging
const log = (level, stepName, message, data = {}) => {
    console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level,
        step: stepName,
        sandboxId: sandboxId, // Include current sandboxId if available
        message,
        ...data,
    }));
};
// --- Main Handler --- //
let sandboxId = null;
async function codingAgentHandler({ event, step, // Use any type
 }) {
    sandboxId = null;
    try {
        // Log event ID at the very beginning
        const eventId = event.id;
        if (!eventId) {
            throw new Error("Event ID is missing.");
        }
        log("info", "HANDLER_START", "TDD Event received.", {
            eventId,
            eventData: event.data,
        });
        log("info", "GET_SANDBOX_ID_START", "Getting sandbox ID...", { eventId });
        // Define getSandbox function locally using step context
        const getSandboxForTools = async (id) => {
            return await getSandbox(id);
        };
        // Assign the global sandboxId variable
        sandboxId = await step.run("get-sandbox-id", async () => {
            log("info", "CREATE_SANDBOX_STEP_START", "Creating sandbox...", {
                eventId,
            });
            const sandbox = await Sandbox.create();
            log("info", "CREATE_SANDBOX_STEP_END", "Sandbox created.", {
                eventId,
                newSandboxId: sandbox.sandboxId,
            });
            return sandbox.sandboxId;
        });
        log("info", "GET_SANDBOX_ID_END", "Got sandbox ID.", { eventId, sandboxId });
        // ADDED: Create tools using imported functions
        log("info", "CREATE_TOOLS_START", "Creating tools...", {
            eventId,
            sandboxId,
        });
        const allTools = getAllTools(log, getSandboxForTools, eventId, sandboxId);
        log("info", "CREATE_TOOLS_END", "Tools created.", { eventId });
        // ADDED: Create agents using imported functions
        log("info", "CREATE_AGENTS_START", "Creating agents...", { eventId });
        const agentDeps = {
            allTools,
            log,
            eventId,
            sandboxId,
            apiKey: process.env.DEEPSEEK_API_KEY,
            modelName: process.env.DEEPSEEK_MODEL || "deepseek-coder",
        };
        const testerAgent = createTesterAgent(agentDeps);
        const codingAgent = createCodingAgent(agentDeps);
        const criticAgent = createCriticAgent(agentDeps);
        log("info", "CREATE_AGENTS_END", "Agents created.", { eventId });
        // --- Create TDD Network --- //
        const devOpsNetwork = createDevOpsNetwork(testerAgent, codingAgent, criticAgent);
        // --- Initialize State and Run Network --- //
        log("info", "INIT_STATE", "Initializing TDD network state.", { eventId });
        const initialTask = event.data?.input ?? "";
        if (!initialTask) {
            throw new Error("Input task is missing in the event data.");
        }
        // FIX: Use the defined type for initial state
        const initialState = {
            task: initialTask,
            status: "NEEDS_TEST",
            sandboxId: sandboxId,
        };
        devOpsNetwork.state.kv.set("network_state", initialState);
        log("info", "NETWORK_RUN_START", "Starting TDD network run...", { eventId });
        await devOpsNetwork.run(initialTask);
        log("info", "NETWORK_RUN_END", "TDD Network run finished.", { eventId });
        // --- Cleanup or Read Final State --- //
        log("info", "READ_FINAL_STATE_START", "Reading final state...", { eventId });
        const finalState = devOpsNetwork.state.kv.get("network_state");
        log("info", "READ_FINAL_STATE_END", "Final Network State retrieved.", {
            eventId,
            finalState,
        });
        // Cleanup using sandboxId from handler scope
        // const currentSandboxId = sandboxId; // Remove unused variable
        // FIX: Temporarily disable killing the sandbox to allow inspection
        /*
        if (currentSandboxId) {
          console.log(`[HANDLER] Killing sandbox ${currentSandboxId}...`)
          await step.run("kill-sandbox", async () => {
            if (!currentSandboxId) {
              console.warn("[HANDLER STEP] Sandbox ID became null before killing.")
              return
            }
            const sandbox = await getSandbox(currentSandboxId)
            if (sandbox) {
              await sandbox.kill()
              console.log(`[HANDLER STEP] Sandbox ${currentSandboxId} killed.`)
            } else {
              console.warn(
                `[HANDLER STEP] Sandbox ${currentSandboxId} not found for killing.`
              )
            }
          })
        }
        */
        log("info", "HANDLER_END", "Event processing complete.", { eventId });
        return { event };
    }
    catch (error) {
        log("error", "HANDLER_ERROR", "An error occurred in the main handler.", {
            eventId: event.id,
            error: error.message,
            stack: error.stack,
        });
        // Cleanup on error using sandboxId from handler scope
        // const errorSandboxId = sandboxId; // Remove unused variable
        // FIX: Temporarily disable killing the sandbox on error
        /*
        if (errorSandboxId) {
          console.log(
            `[HANDLER ERROR] Attempting to kill sandbox ${errorSandboxId} after error...`
          )
          try {
            await step.run("kill-sandbox-on-error", async () => {
              if (!errorSandboxId) {
                console.warn(
                  "[HANDLER STEP ERROR] Sandbox ID became null before killing on error."
                )
                return
              }
              const sandbox = await getSandbox(errorSandboxId)
              if (sandbox) {
                await sandbox.kill()
                console.log(
                  `[HANDLER STEP] Sandbox ${errorSandboxId} killed after error.`
                )
              } else {
                console.warn(
                  `[HANDLER STEP] Sandbox ${errorSandboxId} not found for killing after error.`
                )
              }
            })
          } catch (killError) {
            console.error(
              `[HANDLER ERROR] Failed to kill sandbox ${errorSandboxId} after initial error:`,
              killError
            )
          }
        }
        */
        throw error;
    }
}
// --- Register Inngest Function --- //
// FIX: Rename exported function to avoid conflict if needed, or ensure only one definition is exported.
// Assuming the original export near the end is the intended one. Remove this definition.
// const codingAgent = inngest.createFunction( ... ); // REMOVE THIS BLOCK
// --- Export for Server --- //
// FIX: Ensure codingAgentHandler is defined before being used here.
// Define the function before exporting it.
const codingAgentFunction = inngest.createFunction({ id: "coding-agent-tdd-function", name: "TDD Coding Agent Function" }, // Updated ID and Name
{ event: "coding-agent/run" }, codingAgentHandler // Use the handler function defined above
);
export { inngest, codingAgentFunction as codingAgent }; // Export with the original name
// --- HTTP Server (Entry Point) --- //
import { serve } from "inngest/express"; // Import the serve adapter
import express from "express";
const app = express();
app.use(express.json()); // Middleware to parse JSON bodies
// Serve the Inngest function(s)
// FIX: Use the correctly defined function variable
app.use("/api/inngest", serve({ client: inngest, functions: [codingAgentFunction] }));
const APP_PORT = process.env.APP_PORT || 8484; // Changed default port to 8484
// Only start the server if not in a test environment
if (process.env.NODE_ENV !== "test") {
    app.listen(APP_PORT, () => {
        log("info", "SERVER_START", `Inngest server listening on http://localhost:${APP_PORT}/api/inngest`, { port: APP_PORT });
    });
}
//# sourceMappingURL=index.js.map