import { createAgent } from "@inngest/agent-kit"
import { deepseek } from "@inngest/ai/models"
import { lastAssistantTextMessageContent } from "./inngest/utils.js" // Assuming this utility is needed
import type { TddNetworkState } from "./types.js" // Assuming types are in types.ts
import { Tool } from "@inngest/agent-kit"

// Define types for dependencies (could be imported from a central types file eventually)
type LoggerFunc = (
  level: "info" | "warn" | "error",
  stepName: string,
  message: string,
  data?: object
) => void
// Assuming AgentTool type is exported or available from @inngest/agent-kit implicitly
type AnyTool = Tool<any>

interface AgentDependencies {
  allTools: AnyTool[]
  log: LoggerFunc
  eventId: string
  sandboxId: string | null
  apiKey: string
  modelName: string
}

export function createTesterAgent({
  allTools,
  log,
  eventId,
  sandboxId,
  apiKey,
  modelName,
}: AgentDependencies) {
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
                 **If critique on previous tests is provided (check state.test_critique), address the critique and revise the tests before saving using 'createOrUpdateFiles'.**
                 Your final action MUST be a call to 'createOrUpdateFiles' with the content for 'test.js'.`,
    model: deepseek({
      apiKey: apiKey,
      model: modelName,
    }),
    tools: allTools,
    lifecycle: {
      onFinish: async ({ result, network }: any) => {
        const hookStepName = "TesterAgent_onFinish"
        log("info", hookStepName, "Hook started.", {
          eventId,
          result: JSON.stringify(result),
        })
        if (network?.state?.kv && sandboxId) {
          const state: Partial<TddNetworkState> =
            network.state.kv.get("network_state") || {}
          log("info", hookStepName, "Retrieved current state.", {
            eventId,
            currentState: state,
          })
          let artifactPath: string | null = null
          const createOrUpdateCall = result?.toolCalls?.find(
            (call: any) => call.toolName === "createOrUpdateFiles"
          )
          if (createOrUpdateCall?.result?.artifactPath) {
            artifactPath = createOrUpdateCall.result.artifactPath
            log("info", hookStepName, "Found artifact path in tool result.", {
              eventId,
              artifactPath,
            })
          } else {
            log(
              "warn",
              hookStepName,
              "Could not find artifact path in tool result.",
              { eventId }
            )
          }
          if (artifactPath) {
            const newState: TddNetworkState = {
              ...state,
              task: state.task || "",
              status: "NEEDS_TEST_CRITIQUE",
              sandboxId: state.sandboxId || sandboxId,
              test_artifact_path: artifactPath,
              test_code: undefined,
              test_critique: undefined,
              error: undefined,
            }
            log("info", hookStepName, "Updating state with artifact path.", {
              eventId,
              newState,
            })
            network.state.kv.set("network_state", newState)
            log(
              "info",
              hookStepName,
              "State updated. Status: NEEDS_TEST_CRITIQUE.",
              { eventId }
            )
          } else {
            log(
              "error",
              hookStepName,
              "Artifact path not found in result. Setting state to COMPLETED with error.",
              { eventId }
            )
            const errorState: TddNetworkState = {
              ...state,
              task: state.task || "",
              status: "COMPLETED",
              sandboxId: state.sandboxId || sandboxId,
              error: "Tester failed to create artifact.",
            }
            log("info", hookStepName, "Updating state with error.", {
              eventId,
              errorState,
            })
            network.state.kv.set("network_state", errorState)
          }
        } else {
          log(
            "warn",
            hookStepName,
            "Could not update state: network.state.kv or sandboxId missing.",
            { eventId }
          )
        }
        return result
      },
    },
  })
}

export function createCodingAgent({
  allTools,
  log,
  eventId,
  sandboxId,
  apiKey,
  modelName,
}: AgentDependencies) {
  return createAgent({
    name: "Coding Agent",
    description:
      "Writes or revises implementation code based on task, tests, and critique.",
    system: `You are a software developer agent. 
                 Your task is to write the implementation code for a function based on the provided task description and unit tests.
                 
                 **Workflow:**
                 1. **Get Tests:** Use the 'processArtifact' tool to read the test file ('test.js') from the artifact specified in 'state.test_artifact_path'.
                 2. **Check Critique:** If critique on previous code is provided (check state.code_critique), address the critique and revise the code.
                 3. **Write Implementation:** Write the final implementation code based on the tests and any critique.
                 4. **Save Code:** Save the final implementation code into 'implementation.js' using the 'createOrUpdateFiles' tool.
                 
                 Focus on writing only the implementation code in 'implementation.js'.`,
    model: deepseek({
      apiKey: apiKey,
      model: modelName,
    }),
    tools: allTools,
    lifecycle: {
      onFinish: async ({ result, network }: any) => {
        const hookStepName = "CodingAgent_onFinish"
        log("info", hookStepName, "Hook started.", {
          eventId,
          result: JSON.stringify(result),
        })
        if (network?.state?.kv && sandboxId) {
          const state: Partial<TddNetworkState> =
            network.state.kv.get("network_state") || {}
          log("info", hookStepName, "Retrieved current state.", {
            eventId,
            currentState: state,
          })
          let artifactPath: string | null = null
          const createOrUpdateCall = result?.toolCalls?.find(
            (call: any) => call.toolName === "createOrUpdateFiles"
          )
          if (createOrUpdateCall?.result?.artifactPath) {
            artifactPath = createOrUpdateCall.result.artifactPath
            log("info", hookStepName, "Found artifact path in tool result.", {
              eventId,
              artifactPath,
            })
          } else {
            log(
              "warn",
              hookStepName,
              "Could not find artifact path in tool result.",
              { eventId }
            )
          }
          if (artifactPath) {
            const newState: TddNetworkState = {
              ...state,
              task: state.task || "",
              status: "NEEDS_CODE_CRITIQUE",
              sandboxId: state.sandboxId || sandboxId,
              code_artifact_path: artifactPath,
              current_code: undefined,
              code_critique: undefined,
              error: undefined,
            }
            log("info", hookStepName, "Updating state with artifact path.", {
              eventId,
              newState,
            })
            network.state.kv.set("network_state", newState)
            log(
              "info",
              hookStepName,
              "State updated. Status: NEEDS_CODE_CRITIQUE.",
              { eventId }
            )
          } else {
            log(
              "error",
              hookStepName,
              "Artifact path not found in result. Setting state to COMPLETED with error.",
              { eventId }
            )
            const errorState: TddNetworkState = {
              ...state,
              task: state.task || "",
              status: "COMPLETED",
              sandboxId: state.sandboxId || sandboxId,
              error: "Coder failed to create artifact.",
            }
            log("info", hookStepName, "Updating state with error.", {
              eventId,
              errorState,
            })
            network.state.kv.set("network_state", errorState)
          }
        } else {
          log(
            "warn",
            hookStepName,
            "Could not update state: network.state.kv or sandboxId missing.",
            { eventId }
          )
        }
        return result
      },
    },
  })
}

export function createCriticAgent({
  allTools,
  log,
  eventId,
  sandboxId,
  apiKey,
  modelName,
}: AgentDependencies) {
  return createAgent({
    name: "Critic Agent",
    description:
      "Reviews code and/or tests for correctness and style, providing clear feedback.",
    system: `You are a code reviewer agent. 
                 Your task is to review provided code and/or tests based on the original task description.
                 **Current Status:** You will be called in either 'NEEDS_TEST_CRITIQUE' or 'NEEDS_CODE_CRITIQUE' status.
                 
                 **Workflow to get file content:**
                 1. **Check State:** Determine which artifact path to use based on the status: 'state.test_artifact_path' for tests or 'state.code_artifact_path' for code.
                 2. **Process Artifact & Read File:** Use the 'processArtifact' tool. Provide the local 'artifactPath' from the state and the specific 'fileToRead' (e.g., 'test.js' or 'implementation.js').
                 3. **Read Both for Code Critique:** If the status is 'NEEDS_CODE_CRITIQUE', you MUST use 'processArtifact' TWICE: once for the implementation ('implementation.js' from 'state.code_artifact_path') AND once for the tests ('test.js' from 'state.test_artifact_path').
                 
                 **Review:** Once you have the file content(s) from 'processArtifact', perform your review based on the original task and the current code/tests.

                 **Output Format:** Provide clear feedback. 
                 - If everything is good, state **'Tests OK'** or **'Code OK'** or **'Approved'** or **'LGTM'**. Use clear approval terms.
                 - If revisions are needed, clearly state **'Revision needed'** and explain the issues/errors/problems found.
                 Your response will determine the next step in the workflow.`,
    model: deepseek({
      apiKey: apiKey,
      model: modelName,
    }),
    tools: allTools,
    lifecycle: {
      onResponse: async ({ result, network }: any) => {
        const hookStepName = "CriticAgent_onResponse"
        const critiqueText =
          lastAssistantTextMessageContent(result) || "No critique provided."
        log("info", hookStepName, "Hook started.", {
          eventId,
          critiqueTextLen: critiqueText.length,
        })
        if (network?.state?.kv) {
          const state: Partial<TddNetworkState> =
            network.state.kv.get("network_state") || {}
          let nextStatus: string = state.status || "UNKNOWN"
          const currentStatus = state.status
          log("info", hookStepName, "Received critique.", {
            eventId,
            currentStatus: currentStatus ?? "undefined",
          })
          log("info", hookStepName, "Critique Text Snippet.", {
            eventId,
            critiqueSnippet: critiqueText.substring(0, 100),
          })
          const critiqueLower = critiqueText.toLowerCase()
          const needsRevision =
            critiqueLower.includes("revision") ||
            critiqueLower.includes("issue") ||
            critiqueLower.includes("error") ||
            critiqueLower.includes("fix") ||
            critiqueLower.includes("problem")
          const isApproved =
            critiqueLower.includes("approved") ||
            critiqueLower.includes("ok") ||
            critiqueLower.includes("looks good") ||
            critiqueLower.includes("lgtm")
          if (state.status === "NEEDS_TEST_CRITIQUE") {
            state.test_critique = critiqueText
            if (needsRevision) {
              nextStatus = "NEEDS_TEST_REVISION"
              log("info", hookStepName, "Decision: Tests need revision.", {
                eventId,
              })
            } else if (isApproved) {
              nextStatus = "NEEDS_CODE"
              log("info", hookStepName, "Decision: Tests approved.", {
                eventId,
              })
            } else {
              log(
                "info",
                hookStepName,
                "Decision: Ambiguous critique on tests. Assuming OK.",
                { eventId }
              )
              nextStatus = "NEEDS_CODE"
            }
          } else if (state.status === "NEEDS_CODE_CRITIQUE") {
            state.code_critique = critiqueText
            if (needsRevision) {
              nextStatus = "NEEDS_CODE_REVISION"
              log("info", hookStepName, "Decision: Code needs revision.", {
                eventId,
              })
            } else if (isApproved) {
              nextStatus = "COMPLETED"
              log(
                "info",
                hookStepName,
                "Decision: Code approved. Completing task.",
                { eventId }
              )
              const finalCompletedState: TddNetworkState = {
                ...state,
                task: state.task || "",
                status: nextStatus,
                sandboxId: state.sandboxId || sandboxId,
                code_critique: critiqueText,
                error: undefined,
              }
              log(
                "info",
                hookStepName,
                "FINAL STATE (COMPLETED). Setting state.",
                { eventId, finalCompletedState }
              )
              network.state.kv.set("network_state", finalCompletedState)
              return result
            } else {
              log(
                "info",
                hookStepName,
                "Decision: Ambiguous critique on code. Assuming OK.",
                { eventId }
              )
              nextStatus = "COMPLETED"
              const finalCompletedState: TddNetworkState = {
                ...state,
                task: state.task || "",
                status: nextStatus,
                sandboxId: state.sandboxId || sandboxId,
                code_critique: critiqueText,
                error: undefined,
              }
              log(
                "info",
                hookStepName,
                "FINAL STATE (COMPLETED - Ambiguous Critique). Setting state.",
                { eventId, finalCompletedState }
              )
              network.state.kv.set("network_state", finalCompletedState)
              return result
            }
          } else {
            log("warn", hookStepName, "Critic called in unexpected state.", {
              eventId,
              currentStatus: currentStatus ?? "undefined",
            })
            nextStatus = "COMPLETED"
            const finalCompletedState: TddNetworkState = {
              ...state,
              task: state.task || "",
              status: nextStatus,
              sandboxId: state.sandboxId || sandboxId,
              error: `Critic called in unexpected state: ${currentStatus ?? "undefined"}`,
            }
            log(
              "warn",
              hookStepName,
              "FINAL STATE (COMPLETED - Unexpected). Setting state.",
              { eventId, finalCompletedState }
            )
            network.state.kv.set("network_state", finalCompletedState)
            return result
          }
          state.status = nextStatus
          log("info", hookStepName, "Updating state with next status.", {
            eventId,
            nextStatus,
            state,
          })
          network.state.kv.set("network_state", state)
        } else {
          log(
            "warn",
            hookStepName,
            "Could not update state: network.state.kv missing.",
            { eventId }
          )
        }
        return result
      },
    },
  })
}
