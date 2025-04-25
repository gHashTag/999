import { createAgent } from "@inngest/agent-kit";
import { deepseek } from "@inngest/ai/models";
import { lastAssistantTextMessageContent } from "./inngest/utils.js"; // Assuming this utility is needed
import { NetworkStatus } from "./types.js"; // Import the enum itself for usage
export function createTesterAgent({ allTools, log, eventId, sandboxId, apiKey, modelName, }) {
    return createAgent({
        name: "Tester Agent",
        description: "Writes or revises unit tests based on task and critique.",
        system: `You are a QA engineer agent. 
                 Your task is to write simple unit tests for a given function description.
                 **CRITICAL INSTRUCTION: You MUST use ONLY the 'createOrUpdateFiles' tool to save your work.**
                 **CRITICAL INSTRUCTION: Save the tests into a file named EXACTLY 'test.js'.**
                 **CRITICAL INSTRUCTION: Do NOT use the 'terminal' tool to create files.**
                 **Do NOT write implementation code. Write ONLY test code.**
                 Example test using Node.js assert:
                 \`\`\`javascript
                 const assert = require('assert');
                 // Assume implementation is in 'implementation.js' (it will be created later)
                 const { add } = require('./implementation.js'); // Adjust require path if needed

                 assert.strictEqual(add(1, 2), 3, 'Test Case 1 Failed: 1 + 2 = 3');
                 assert.strictEqual(add(-1, 1), 0, 'Test Case 2 Failed: -1 + 1 = 0');
                 console.log('All tests passed!');
                 \`\`\`
                 **CRITICAL INSTRUCTION: Ensure the file is named exactly 'test.js'.**
                 **If critique on previous tests is provided (check state.test_critique), address the critique and revise the tests before saving using 'createOrUpdateFiles'.**
                 Your final action MUST be a call to 'createOrUpdateFiles' with the content for 'test.js'.`,
        model: deepseek({
            apiKey: apiKey,
            model: modelName,
        }),
        tools: allTools,
        lifecycle: {
            onFinish: async ({ result, network }) => {
                const hookStepName = "TesterAgent_onFinish";
                log("info", hookStepName, "Hook started.", { eventId });
                if (!network?.state?.kv || !sandboxId) {
                    log("warn", hookStepName, "KV or sandboxId missing.", { eventId });
                    return result;
                }
                const state = network.state.kv.get("network_state") || {};
                log("info", hookStepName, "Retrieved state.", { eventId });
                let testFileContent = undefined;
                // Find the result of the createOrUpdateFiles tool call
                const createOrUpdateCall = result?.toolCalls?.find((call) => call.toolName === "createOrUpdateFiles");
                const toolResult = createOrUpdateCall?.result;
                // Check if the tool call was successful and returned the new 'files' array
                if (toolResult?.files && !toolResult?.error) {
                    const returnedFiles = toolResult.files;
                    log("info", hookStepName, "Found files in tool result.", {
                        eventId,
                        fileCount: returnedFiles.length,
                        filePaths: returnedFiles.map((f) => f.path),
                    });
                    // Find the specific file we need ('test.js')
                    const testFile = returnedFiles.find((f) => f.path === "test.js");
                    if (testFile) {
                        testFileContent = testFile.content;
                        log("info", hookStepName, "Successfully extracted test.js content.", {
                            eventId,
                            contentLength: testFileContent?.length,
                        });
                    }
                    else {
                        log("warn", hookStepName, "'test.js' not found in tool result files. Found files: " +
                            returnedFiles.map((f) => f.path).join(", "), { eventId });
                    }
                }
                else {
                    log("warn", hookStepName, "Could not find 'files' array in tool result, or tool returned error.", { eventId, toolResult: toolResult });
                }
                // Update state based on whether content was successfully extracted
                if (testFileContent !== undefined) {
                    const newState = {
                        ...state,
                        task: state.task || "",
                        status: NetworkStatus.Enum.NEEDS_CODE_CRITIQUE,
                        sandboxId: state.sandboxId || sandboxId,
                        test_artifact_path: undefined,
                        test_code: testFileContent,
                        test_critique: undefined,
                        implementation_code: undefined,
                        code_critique: undefined,
                        error: undefined,
                    };
                    log("info", hookStepName, "Updating state with test code content.", {
                        eventId,
                    });
                    network.state.kv.set("network_state", newState);
                    log("info", hookStepName, "State updated. Status: NEEDS_CODE_CRITIQUE.", { eventId });
                }
                else {
                    log("error", hookStepName, "Test file content for 'test.js' not found. Setting state to COMPLETED with error.", { eventId });
                    const errorState = {
                        ...state,
                        task: state.task || "",
                        status: NetworkStatus.Enum.COMPLETED,
                        sandboxId: state.sandboxId || sandboxId,
                        error: `Tester failed to create or extract 'test.js' from tool result.`,
                    };
                    log("info", hookStepName, "Updating state with error.", {
                        eventId,
                        errorState,
                    });
                    network.state.kv.set("network_state", errorState);
                }
                return result;
            },
        },
    });
}
export function createCodingAgent({ allTools, log, eventId, sandboxId, apiKey, modelName, }) {
    return createAgent({
        name: "Coding Agent",
        description: "Writes or revises implementation code based on task, tests, and critique.",
        system: `You are a software developer agent. 
                 Your task is to write the implementation code for a function based on the provided task description and unit tests.
                 
                 **Workflow:**
                 1. **Get Tests:** The test code ('test.js') is available in the state ('state.test_code'). Use this directly.
                 2. **Check Critique:** If critique on previous code is provided (check state.code_critique), address the critique and revise the code.
                 3. **Write Implementation:** Write the final implementation code based on the tests and any critique.
                 4. **Save Code:** Save the final implementation code into 'implementation.js' using the 'createOrUpdateFiles' tool.
                 
                 Focus on writing only the implementation code in 'implementation.js'. Do NOT re-read test files using tools.`,
        model: deepseek({
            apiKey: apiKey,
            model: modelName,
        }),
        tools: allTools,
        lifecycle: {
            onFinish: async ({ result, network }) => {
                const hookStepName = "CodingAgent_onFinish";
                log("info", hookStepName, "Hook started.", { eventId });
                if (!network?.state?.kv || !sandboxId) {
                    log("warn", hookStepName, "KV or sandboxId missing.", { eventId });
                    return result;
                }
                const state = network.state.kv.get("network_state") || {};
                log("info", hookStepName, "Retrieved state.", { eventId });
                let implFileContent = undefined;
                // Find the result of the createOrUpdateFiles tool call
                const createOrUpdateCall = result?.toolCalls?.find((call) => call.toolName === "createOrUpdateFiles");
                // Check if the tool call was successful and returned the new 'files' array
                if (createOrUpdateCall?.result?.files &&
                    !createOrUpdateCall?.result?.error) {
                    const returnedFiles = createOrUpdateCall.result.files;
                    log("info", hookStepName, "Found files in tool result.", {
                        eventId,
                        fileCount: returnedFiles.length,
                        filePaths: returnedFiles.map((f) => f.path),
                    });
                    // Find the specific file we need ('implementation.js')
                    const implFile = returnedFiles.find((f) => f.path === "implementation.js");
                    if (implFile) {
                        implFileContent = implFile.content;
                        log("info", hookStepName, "Successfully extracted implementation.js content.", {
                            eventId,
                            contentLength: implFileContent?.length,
                        });
                    }
                    else {
                        log("warn", hookStepName, "'implementation.js' not found in tool result files.", { eventId });
                    }
                }
                else {
                    log("warn", hookStepName, "Could not find 'files' array in tool result, or tool returned error.", { eventId, toolResult: createOrUpdateCall?.result });
                }
                // Update state based on whether content was successfully extracted
                if (implFileContent !== undefined) {
                    const newState = {
                        ...state,
                        task: state.task || "",
                        status: NetworkStatus.Enum.NEEDS_CODE_CRITIQUE,
                        sandboxId: state.sandboxId || sandboxId,
                        test_artifact_path: undefined,
                        test_code: state.test_code,
                        implementation_code: implFileContent,
                        code_critique: undefined,
                        error: undefined,
                    };
                    log("info", hookStepName, "Updating state with implementation code content.", { eventId });
                    network.state.kv.set("network_state", newState);
                    log("info", hookStepName, "State updated. Status: NEEDS_CODE_CRITIQUE.", { eventId });
                }
                else {
                    log("error", hookStepName, "Implementation file content not found. Setting state to COMPLETED with error.", { eventId });
                    const errorState = {
                        ...state,
                        task: state.task || "",
                        status: NetworkStatus.Enum.COMPLETED,
                        sandboxId: state.sandboxId || sandboxId,
                        error: `Coder failed to create or extract 'implementation.js'`,
                    };
                    log("info", hookStepName, "Updating state with error.", {
                        eventId,
                        errorState,
                    });
                    network.state.kv.set("network_state", errorState);
                }
                return result;
            },
        },
    });
}
export function createCriticAgent({ allTools, log, eventId, sandboxId, apiKey, modelName, }) {
    return createAgent({
        name: "Critic Agent",
        description: "Reviews code and/or tests for correctness and style, providing clear feedback.",
        system: async ({ network }) => {
            const state = network?.state?.kv?.get("network_state") || {};
            const status = state.status;
            let basePrompt = `You are a code reviewer agent. Your task is to review provided code and/or tests based on the original task description: "${state.task}".`;
            let contentToReview = "";
            if (status === NetworkStatus.Enum.NEEDS_TEST_CRITIQUE) {
                basePrompt += `\nReview the following unit tests ('test.js'):`;
                contentToReview =
                    state.test_code || "Error: Test code not found in state.";
            }
            else if (status === NetworkStatus.Enum.NEEDS_CODE_CRITIQUE) {
                basePrompt += `\nReview the following implementation code ('implementation.js') against the provided tests ('test.js'):`;
                const implCode = state.implementation_code ||
                    "Error: Implementation code not found in state.";
                const testCode = state.test_code || "Error: Test code not found in state.";
                contentToReview = `\n\n**Implementation (implementation.js):**\n\`\`\`javascript\n${implCode}\n\`\`\`\n\n**Tests (test.js):**\n\`\`\`javascript\n${testCode}\n\`\`\`\n`;
            }
            else {
                basePrompt += `\nERROR: Critic agent called in unexpected state: ${status}. Cannot determine what to review.`;
            }
            const finalPrompt = `${basePrompt}\n\n${contentToReview}\n\n**Review Output Format:** Provide clear feedback. \n- If everything is good, state **'Tests OK'** or **'Code OK'** or **'Approved'** or **'LGTM'**. Use clear approval terms.\n- If revisions are needed, clearly state **'Revision needed'** and explain the issues/errors/problems found.\nYour response will determine the next step in the workflow.`;
            return finalPrompt;
        },
        model: deepseek({
            apiKey: apiKey,
            model: modelName,
        }),
        tools: allTools.filter(tool => tool.name !== "processArtifact"),
        lifecycle: {
            onResponse: async ({ result, network }) => {
                const hookStepName = "CriticAgent_onResponse";
                const critiqueText = lastAssistantTextMessageContent(result) || "No critique provided.";
                log("info", hookStepName, "Hook started.", {
                    eventId,
                    critiqueTextLen: critiqueText.length,
                });
                if (network?.state?.kv) {
                    const state = network.state.kv.get("network_state") || {};
                    let nextStatus = state.status || NetworkStatus.Enum.COMPLETED; // Default to completed if status missing
                    const currentStatus = state.status;
                    const step = network.step; // Assuming step context is available via network object? Check agent-kit docs.
                    log("info", hookStepName, "Received critique.", {
                        eventId,
                        currentStatus: currentStatus ?? "undefined",
                    });
                    log("info", hookStepName, "Critique Text Snippet.", {
                        eventId,
                        critiqueSnippet: critiqueText.substring(0, 100),
                    });
                    const critiqueLower = critiqueText.toLowerCase();
                    const needsRevision = critiqueLower.includes("revision") ||
                        critiqueLower.includes("issue") ||
                        critiqueLower.includes("error") ||
                        critiqueLower.includes("fix") ||
                        critiqueLower.includes("problem");
                    const isApproved = critiqueLower.includes("approved") ||
                        critiqueLower.includes("ok") ||
                        critiqueLower.includes("looks good") ||
                        critiqueLower.includes("lgtm");
                    if (state.status === NetworkStatus.Enum.NEEDS_TEST_CRITIQUE) {
                        state.test_critique = critiqueText;
                        if (needsRevision) {
                            nextStatus = NetworkStatus.Enum.NEEDS_TEST_REVISION;
                            log("info", hookStepName, "Decision: Tests need revision.", {
                                eventId,
                            });
                        }
                        else if (isApproved) {
                            nextStatus = NetworkStatus.Enum.NEEDS_CODE;
                            log("info", hookStepName, "Decision: Tests approved.", {
                                eventId,
                            });
                        }
                        else {
                            log("info", hookStepName, "Decision: Ambiguous critique on tests. Assuming OK.", { eventId });
                            nextStatus = NetworkStatus.Enum.NEEDS_CODE;
                        }
                    }
                    else if (state.status === NetworkStatus.Enum.NEEDS_CODE_CRITIQUE) {
                        state.code_critique = critiqueText;
                        if (needsRevision) {
                            nextStatus = NetworkStatus.Enum.NEEDS_CODE_REVISION;
                            log("info", hookStepName, "Decision: Code needs revision.", {
                                eventId,
                            });
                        }
                        else if (isApproved) {
                            nextStatus = NetworkStatus.Enum.READY_FOR_FINAL_TEST;
                            log("info", hookStepName, "Decision: Code approved. Ready for final tests.", { eventId });
                            const readyState = {
                                ...state,
                                task: state.task || "",
                                status: nextStatus,
                                sandboxId: state.sandboxId || sandboxId,
                                code_critique: critiqueText,
                                error: undefined,
                            };
                            if (step) {
                                await step.sendEvent("send-completion-event", {
                                    name: "tdd/network.ready-for-test",
                                    data: { finalState: readyState },
                                });
                                log("info", hookStepName, "Sent tdd/network.ready-for-test event.", { eventId });
                            }
                            else {
                                log("warn", hookStepName, "Step context not available in onResponse, cannot send event.", { eventId });
                            }
                            log("info", hookStepName, "Updating state for final tests.", {
                                eventId,
                                readyState,
                            });
                            network.state.kv.set("network_state", readyState);
                        }
                        else {
                            log("info", hookStepName, "Decision: Ambiguous critique on code. Assuming OK.", { eventId });
                            nextStatus = NetworkStatus.Enum.READY_FOR_FINAL_TEST;
                            const readyState = {
                                ...state,
                                task: state.task || "",
                                status: nextStatus,
                                sandboxId: state.sandboxId || sandboxId,
                                code_critique: critiqueText,
                                error: undefined,
                            };
                            if (step) {
                                await step.sendEvent("send-completion-event", {
                                    name: "tdd/network.ready-for-test",
                                    data: { finalState: readyState },
                                });
                                log("info", hookStepName, "Sent tdd/network.ready-for-test event.", { eventId });
                            }
                            else {
                                log("warn", hookStepName, "Step context not available in onResponse, cannot send event.", { eventId });
                            }
                            log("info", hookStepName, "Updating state for final tests.", {
                                eventId,
                                readyState,
                            });
                            network.state.kv.set("network_state", readyState);
                        }
                    }
                    else {
                        log("warn", hookStepName, "Critic called in unexpected state.", {
                            eventId,
                            currentStatus: currentStatus ?? "undefined",
                        });
                        nextStatus = "COMPLETED";
                        const finalCompletedState = {
                            ...state,
                            task: state.task || "",
                            status: nextStatus,
                            sandboxId: state.sandboxId || sandboxId,
                            error: `Critic called in unexpected state: ${currentStatus ?? "undefined"}`,
                        };
                        log("warn", hookStepName, "FINAL STATE (COMPLETED - Unexpected). Setting state.", { eventId, finalCompletedState });
                        network.state.kv.set("network_state", finalCompletedState);
                    }
                }
                else {
                    log("warn", hookStepName, "Could not update state: network.state.kv missing.", { eventId });
                }
                return result;
            },
        },
    });
}
//# sourceMappingURL=agentDefinitions.js.map