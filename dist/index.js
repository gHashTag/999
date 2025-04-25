/* eslint-disable */
import "dotenv/config";
import { Inngest } from "inngest";
import { getSandbox } from "./inngest/index.js";
import { Sandbox } from "@e2b/code-interpreter";
import { createDevOpsNetwork } from "./network/network.js";
import { NetworkStatus } from "./types/network.js";
import { codingAgentEventSchema } from "./types/events.js";
import { getAllTools } from "./tools/toolDefinitions.js";
import { createTesterAgent, createCodingAgent, createCriticAgent, } from "./agents/index.js";
import { log } from "./utils/index.js";
// Initialize Inngest Client
const inngest = new Inngest({ id: "agentkit-tdd-agent" });
// --- Main Handler --- //
// FIX: Make sandboxId local to the handler, pass it explicitly where needed (e.g., to logger or tools)
// let sandboxId: string | null = null
async function codingAgentHandler({ event, step, // Use any type
 }) {
    // FIX: Make sandboxId local to the handler, pass it explicitly where needed (e.g., to logger or tools)
    // sandboxId = null
    try {
        // Log event ID at the very beginning
        const eventId = event.id;
        if (!eventId) {
            throw new Error("Event ID is missing.");
        }
        // Validate event data using the schema
        const validatedData = codingAgentEventSchema.safeParse(event.data);
        if (!validatedData.success) {
            log("error", "HANDLER_START", "Invalid event data.", {
                eventId,
                errors: validatedData.error.issues,
            });
            throw new Error(`Invalid event data: ${validatedData.error.message}`);
        }
        const taskInput = validatedData.data.input; // Access validated input
        log("info", "HANDLER_START", "TDD Event received.", {
            eventId,
            eventData: event.data, // Log original data
            taskInput, // Log extracted task
        });
        log("info", "GET_SANDBOX_ID_START", "Getting sandbox ID...", { eventId });
        // Define getSandbox function locally using step context
        const getSandboxForTools = async (id) => {
            return await getSandbox(id);
        };
        // Assign the global sandboxId variable
        const sandboxId = await step.run("get-sandbox-id", async () => {
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
            apiKey: process.env.DEEPSEEK_API_KEY,
            modelName: process.env.DEEPSEEK_MODEL || "deepseek-coder",
        };
        const testerAgent = createTesterAgent(agentDeps);
        const codingAgent = createCodingAgent(agentDeps);
        const criticAgent = createCriticAgent(agentDeps);
        log("info", "CREATE_AGENTS_END", "Agents created.", { eventId });
        // --- Create TDD Network --- //
        const devOpsNetwork = createDevOpsNetwork(testerAgent, codingAgent, criticAgent);
        // --- Initialize Network State --- //
        log("info", "INIT_STATE_START", "Initializing network state...", {
            eventId,
        });
        const initialState = {
            task: taskInput, // Use validated taskInput
            status: NetworkStatus.Enum.NEEDS_TEST, // Start with needing tests
            sandboxId: sandboxId,
        };
        // Use step context for KV access
        await step.state.kv.set("network_state", initialState);
        log("info", "INIT_STATE_END", "Network state initialized.", {
            eventId,
            initialState,
        });
        // --- Run the Network --- //
        log("info", "NETWORK_RUN_START", "Running DevOps network...", { eventId });
        // Pass an empty string as the first argument, as run() expects input/overrides
        const networkResult = await devOpsNetwork.run("");
        log("info", "NETWORK_RUN_END", "DevOps network finished.", {
            eventId,
            // Access state and output correctly from NetworkRun type
            finalStatus: networkResult.state.kv.get("status"), // Assuming status is in KV
            // Output is top-level on NetworkRun result - Error TS2339 - Commenting out for now
            // output: networkResult.output,
        });
        // --- Persist Final State from Network Run --- //
        // networkResult.state is the State object. Get TddNetworkState from its KV.
        const finalStateFromNetwork = networkResult.state.kv.get("network_state");
        if (finalStateFromNetwork) {
            log("info", "PERSIST_FINAL_STATE_START", "Persisting final state from network run...", { eventId, status: finalStateFromNetwork.status } // Direct access is ok now
            );
            await step.state.kv.set("network_state", finalStateFromNetwork);
            log("info", "PERSIST_FINAL_STATE_END", "Final state persisted.", {
                eventId,
            });
        }
        else {
            // This branch might be less likely now since networkResult.state should exist
            log("error", "NETWORK_RESULT_STATE_MISSING", "Final state missing from network result (unexpected).", { eventId });
            // Potentially throw an error or handle this case depending on expected behavior
            throw new Error("Network run did not produce a final state.");
        }
        // TODO: MAJOR REFACTOR NEEDED HERE
        // The following logic assumed onFinish hooks updated the state and sent events.
        // Now, this logic needs to be implemented here, using networkResult and the final state.
        // This includes:
        // 1. Determining the final status (COMPLETED, FAILED_TESTS, etc.)
        // 2. Extracting critique if the last step was Critic.
        // 3. Downloading files (test.js, implementation.js) using sandboxId from state.
        // 4. Updating state with downloaded files.
        // 5. Running final tests.
        // 6. Updating final state based on test results.
        // 7. Sending final events.
        // --- Placeholder for post-network logic --- //
        log("warn", "POST_NETWORK_REFACTOR", "Logic after network run needs refactoring - state/event updates moved here.", { eventId });
        // Fetch final state after network run (NOW reads the state persisted above)
        const finalStateFromKV = (await step.state.kv.get("network_state"));
        if (!finalStateFromKV) {
            log("error", "FINAL_STATE_ERROR", "Could not retrieve final state from KV store.", { eventId });
            throw new Error("Final state missing after network run.");
        }
        log("info", "FINAL_STATE_LOG", "Logging final network state after network run (before tests/cleanup).", {
            eventId,
            finalState: finalStateFromKV,
        });
        // --- Simplified Logic: Assume network reaches some terminal state --- //
        // THIS IS A TEMPORARY SIMPLIFICATION - Needs proper implementation
        if (finalStateFromKV.status === NetworkStatus.Enum.READY_FOR_FINAL_TEST ||
            finalStateFromKV.status === NetworkStatus.Enum.COMPLETED ||
            finalStateFromKV.status === NetworkStatus.Enum.COMPLETED_TESTS_FAILED ||
            finalStateFromKV.status === NetworkStatus.Enum.COMPLETED_TESTS_PASSED) {
            log("info", "POST_NETWORK_SIMPLIFIED", "Network reached a terminal state. Proceeding with placeholder cleanup.", { eventId, status: finalStateFromKV.status });
            // Placeholder: Just log final state and return
        }
        else {
            log("warn", "POST_NETWORK_UNEXPECTED", "Network finished with non-terminal status. Needs handling.", { eventId, status: finalStateFromKV.status });
            // Placeholder: Update state to completed error?
            const errorState = {
                ...finalStateFromKV,
                status: NetworkStatus.Enum.COMPLETED,
                error: `Network finished unexpectedly with status: ${finalStateFromKV.status}`,
            };
            await step.state.kv.set("network_state", errorState);
            log("info", "FINAL_STATE_LOG", "Logging final network state after unexpected finish.", { eventId, finalState: errorState });
        }
        // --- Original Final Test Logic (Needs Integration with New Flow) --- //
        /*
        const completionEvent = await step.waitForEvent(...)
        if (!completionEvent) { ... }
        const stateAfterNetwork = await step.state.kv.get("network_state")
        if (stateAfterNetwork?.status === NetworkStatus.Enum.READY_FOR_FINAL_TEST) {
            await step.run("run-final-tests", async () => {
                // ... existing test logic using stateAfterNetwork ...
            })
        }
        */
        // Cleanup (Temporarily disabled)
        log("info", "HANDLER_END", "Event processing complete (placeholder).", {
            eventId,
        });
        return { finalState: await step.state.kv.get("network_state") }; // Return final state
    }
    catch (error) {
        log("error", "HANDLER_ERROR", "An error occurred in the main handler.", {
            eventId: event.id,
            error: error.message,
            stack: error.stack,
        });
        // Cleanup on error (Temporarily disabled)
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
// FIX: Import testRunnerAgent correctly if needed here or ensure it's defined
// Assuming testRunnerAgent function definition is needed for the handler below
// import { testRunnerAgent } from "./testRunnerAgent.js" // Re-add import if needed
// Serve the Inngest function(s)
// FIX: Use the correctly defined function variable
app.use("/api/inngest", serve({ client: inngest, functions: [codingAgentFunction] }));
const APP_PORT = process.env.APP_PORT || 8484; // Changed default port to 8484
// Only start the server if not in a test environment
if (process.env.NODE_ENV !== "test") {
    app.listen(APP_PORT, () => {
        // FIX: Use the imported log function
        log("info", "SERVER_START", `Inngest server listening on http://localhost:${APP_PORT}/api/inngest`, { port: APP_PORT });
    });
}
//# sourceMappingURL=index.js.map