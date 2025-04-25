/* eslint-disable */
import "dotenv/config";
import { Inngest } from "inngest";
import { getSandbox } from "./inngest/utils.js";
import { Sandbox } from "@e2b/code-interpreter";
import { createDevOpsNetwork } from "./network.js";
import { NetworkStatus } from "./types.js";
import { getAllTools } from "./toolDefinitions.js";
import { createTesterAgent, createCodingAgent, createCriticAgent, } from "./agentDefinitions.js";
import { log } from "./utils/logger.js";
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
            eventId,
            sandboxId,
            apiKey: process.env.DEEPSEEK_API_KEY,
            modelName: process.env.DEEPSEEK_MODEL || "deepseek-coder",
            getSandbox: getSandboxForTools,
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
        log("info", "NETWORK_RUN_END", "TDD Network run finished (agents loop).", {
            eventId,
        });
        // --- Wait for Network Completion Signal & Run Final Tests --- //
        log("info", "WAIT_FOR_COMPLETION_START", "Waiting for network completion signal...", { eventId });
        const completionEvent = await step.waitForEvent("wait-for-network-completion", {
            event: "tdd/network.ready-for-test", // Event sent by CriticAgent on approval
            timeout: "5m", // Adjust timeout as needed
        });
        if (!completionEvent) {
            log("warn", "NETWORK_TIMEOUT", "Network did not reach READY_FOR_FINAL_TEST within timeout.", { eventId });
            // Optionally update state to reflect timeout
            const timeoutState = devOpsNetwork.state.kv.get("network_state") || {};
            const finalTimeoutState = {
                ...timeoutState,
                task: timeoutState.task || "",
                status: NetworkStatus.Enum.COMPLETED, // Or a specific TIMEOUT status
                sandboxId: timeoutState.sandboxId ?? null,
                error: "Network completion timeout.",
            };
            devOpsNetwork.state.kv.set("network_state", finalTimeoutState);
            log("info", "FINAL_STATE_LOG", "Logging final network state after timeout.", { eventId, finalState: finalTimeoutState });
            return { message: "Network timeout" };
        }
        log("info", "NETWORK_COMPLETED_EVENT", "Received network completion signal.", { eventId /*, completionEventData: completionEvent.data */ });
        // Fetch the state *after* receiving the completion signal
        const stateAfterNetwork = devOpsNetwork.state.kv.get("network_state");
        // Double-check status just in case
        if (stateAfterNetwork?.status === NetworkStatus.Enum.READY_FOR_FINAL_TEST) {
            log("info", "FINAL_TEST_RUN_START", "State confirmed READY_FOR_FINAL_TEST. Running final tests...", {
                eventId,
                sandboxId: stateAfterNetwork.sandboxId,
            });
            // Run final tests within a step
            await step.run("run-final-tests", async () => {
                const testStepName = "STEP_run-final-tests";
                // Use state fetched AFTER network completion
                const currentState = stateAfterNetwork;
                const testCode = currentState.test_code;
                const implCode = currentState.implementation_code;
                const currentSandboxId = currentState.sandboxId;
                if (!currentSandboxId) {
                    log("error", testStepName, "Sandbox ID missing before final tests.", {
                        eventId,
                    });
                    // Update state to FAILED immediately
                    const errorState = {
                        ...currentState,
                        task: currentState.task || "",
                        status: NetworkStatus.Enum.COMPLETED_TESTS_FAILED,
                        sandboxId: null,
                        error: "Final test run failed: Sandbox ID missing.",
                    };
                    devOpsNetwork.state.kv.set("network_state", errorState);
                    throw new Error("Cannot run final tests: Sandbox ID missing in state.");
                }
                if (!testCode || !implCode) {
                    log("error", testStepName, "Code or tests missing for final run.", {
                        eventId,
                        sandboxId: currentSandboxId,
                        hasTestCode: !!testCode,
                        hasImplCode: !!implCode,
                    });
                    // Update state to FAILED
                    const errorState = {
                        ...currentState,
                        task: currentState.task || "",
                        status: NetworkStatus.Enum.COMPLETED_TESTS_FAILED,
                        sandboxId: currentSandboxId,
                        error: "Final test run failed: Code or tests missing.",
                    };
                    devOpsNetwork.state.kv.set("network_state", errorState);
                    throw new Error("Code or tests missing for final run.");
                }
                // FIX: Get sandbox directly instead of finding tools
                const sandbox = await getSandboxForTools(currentSandboxId);
                if (!sandbox) {
                    throw new Error(`Sandbox not found for ID: ${currentSandboxId}`);
                }
                let terminalResult = null;
                try {
                    log("info", `${testStepName}_WriteFiles`, "Writing test/impl files...", { eventId, sandboxId: currentSandboxId });
                    // FIX: Use sandbox directly to write files
                    await sandbox.files.write("implementation.js", implCode);
                    await sandbox.files.write("test.js", testCode);
                    log("info", `${testStepName}_RunTests`, "Running node test.js...", {
                        eventId,
                        sandboxId: currentSandboxId,
                    });
                    // FIX: Use sandbox directly to run command
                    terminalResult = await sandbox.commands.run("node test.js");
                }
                catch (toolError) {
                    log("error", testStepName, "Error during direct sandbox operation in final test run.", {
                        eventId,
                        sandboxId: currentSandboxId,
                        error: toolError.message,
                        stack: toolError.stack,
                    });
                    // Update state to FAILED
                    const errorState = {
                        ...currentState, // Use state fetched at start of step
                        task: currentState.task || "",
                        status: NetworkStatus.Enum.COMPLETED_TESTS_FAILED,
                        sandboxId: currentSandboxId,
                        error: `Final test run failed during tool execution: ${toolError.message}`,
                    };
                    devOpsNetwork.state.kv.set("network_state", errorState);
                    throw toolError; // Rethrow to fail the step
                }
                // Analyze terminal result (similar logic to previous onFinish)
                let finalTestStatus = NetworkStatus.Enum.COMPLETED_TESTS_FAILED;
                let testOutput = "Error: Terminal result not available or invalid.";
                let errorMessage = "Test Runner failed: Terminal result missing or invalid.";
                if (terminalResult &&
                    typeof terminalResult === "object" &&
                    terminalResult !== null &&
                    "exitCode" in terminalResult) {
                    const termOutput = terminalResult;
                    testOutput = `Exit Code: ${termOutput.exitCode}\nStdout:\n${termOutput.stdout || ""}\nStderr:\n${termOutput.stderr || ""}`;
                    log("info", testStepName, "Analyzed terminal result.", {
                        eventId,
                        sandboxId: currentSandboxId,
                        exitCode: termOutput.exitCode,
                    });
                    if (termOutput.error) {
                        errorMessage = `Final test run failed via tool error: ${termOutput.error}`;
                    }
                    else if (termOutput.exitCode === 0) {
                        if (termOutput.stderr && termOutput.stderr.trim() !== "") {
                            errorMessage =
                                "Final tests failed (stderr output detected despite exit code 0).";
                        }
                        else {
                            finalTestStatus = NetworkStatus.Enum.COMPLETED_TESTS_PASSED;
                            errorMessage = undefined;
                            log("info", testStepName, "Final tests PASSED.", {
                                eventId,
                                sandboxId: currentSandboxId,
                            });
                        }
                    }
                    else {
                        errorMessage = `Final tests failed (Exit Code: ${termOutput.exitCode}).`;
                    }
                }
                else {
                    log("error", testStepName, "Invalid terminal result received.", {
                        eventId,
                        sandboxId: currentSandboxId,
                        terminalResult,
                    });
                }
                // Update state with final test result
                // Re-fetch state again before final update
                const stateBeforeFinalUpdate = devOpsNetwork.state.kv.get("network_state") || {};
                const finalStateUpdate = {
                    ...stateBeforeFinalUpdate,
                    task: stateBeforeFinalUpdate.task || "",
                    status: finalTestStatus,
                    sandboxId: currentSandboxId ?? null,
                    error: errorMessage,
                    test_run_output: testOutput,
                    test_critique: undefined,
                    code_critique: undefined,
                };
                devOpsNetwork.state.kv.set("network_state", finalStateUpdate);
                log("info", testStepName, `Final state updated after tests. Status: ${finalTestStatus}.`, { eventId, sandboxId: currentSandboxId });
            }); // End step.run("run-final-tests")
            // Log the final state after the test step
            const stateAfterTests = devOpsNetwork.state.kv.get("network_state");
            log("info", "FINAL_STATE_LOG", "Logging final network state after tests.", { eventId, finalState: stateAfterTests });
        }
        else {
            // This case should ideally not happen if waitForEvent worked correctly
            // But log it just in case state changed unexpectedly or event was wrong
            log("warn", "POST_NETWORK_CHECK_UNEXPECTED_STATUS", `Received completion signal, but status is ${stateAfterNetwork?.status}. Skipping final tests.`, { eventId });
            log("info", "FINAL_STATE_LOG", "Logging final network state (skipped tests).", { eventId, finalState: stateAfterNetwork });
        }
        // Cleanup using sandboxId from the state
        // FIX: Temporarily disable killing the sandbox to allow inspection
        /*
        // Extract the sandbox ID *before* the potential kill step
        const finalSandboxId = (
          devOpsNetwork.state.kv.get("network_state") as TddNetworkState | undefined
        )?.sandboxId
        if (finalSandboxId) {
          console.log(`[HANDLER] Killing sandbox ${finalSandboxId}...`)
          await step.run("kill-sandbox", async () => {
            if (!finalSandboxId) {
              console.warn("[HANDLER STEP] Sandbox ID became null before killing.")
              return
            }
            const sandbox = await getSandbox(finalSandboxId) // Assuming getSandbox is available
            if (sandbox) {
              await sandbox.kill()
              console.log(`[HANDLER STEP] Sandbox ${finalSandboxId} killed.`)
            } else {
              console.warn(
                `[HANDLER STEP] Sandbox ${finalSandboxId} not found for killing.`
              )
            }
          })
        }
        */
        log("info", "HANDLER_END", "Event processing complete.", { eventId });
        return { finalState: devOpsNetwork.state.kv.get("network_state") };
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