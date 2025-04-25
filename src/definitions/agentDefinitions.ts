import { createAgent } from "@inngest/agent-kit"
import { deepseek } from "@inngest/ai/models"
// Updated import paths
import { TddNetworkState, NetworkStatus } from "@/types/network"
import type { AgentDependencies, AnyTool } from "@/types/agents"
// --- End updated import paths
// import { Sandbox } from "@e2b/code-interpreter" // Removed unused

// Define types for dependencies (could be imported from a central types file eventually)
// Assuming AgentTool type is exported or available from @inngest/agent-kit implicitly

// UPDATED: Reflect that args passed to onFinish likely comes from Inngest's Result<StateData>
// and might contain step context implicitly or explicitly.
// interface InngestOnFinishArgs { ... } // Removed unused interface

// Result type for onFinish hooks that download content
// interface FileDownloadResult { ... } // Removed as onFinish hooks are removed

// Define a more specific type for the system prompt context
// TODO: Consolidate this with the one in src/agents/critic/logic/createCriticAgent.ts
// interface SystemContext {
//   network?: {
//     get: (key: string) => Partial<TddNetworkState> | undefined
//   }
// }

export function createTesterAgent({
  allTools,
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
                 **CRITICAL INSTRUCTION: Ensure the file is named exactly 'test.js'.**
                 **If critique on previous tests is provided (check state.test_critique), address the critique and revise the tests before saving using 'createOrUpdateFiles'.**
                 Your final action MUST be a call to 'createOrUpdateFiles' with the content for 'test.js'.
                 **If the task description or critique is unclear, use the 'askHumanForInput' tool to ask for clarification before writing tests.**`, // System prompt needs access to state eventually
    model: deepseek({
      apiKey: apiKey,
      model: modelName,
    }),
    tools: allTools,
  })
}

export function createCodingAgent({
  allTools,
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
                 1. **Get Tests:** The test code ('test.js') is available in the state ('state.test_code'). Use this directly.
                 2. **Check Critique:** If critique on previous code is provided (check state.code_critique), address the critique and revise the code.
                 3. **Write Implementation:** Write the final implementation code based on the tests and any critique.
                 4. **Save Code:** Save the final implementation code into 'implementation.js' using the 'createOrUpdateFiles' tool.
                 
                 Focus on writing only the implementation code in 'implementation.js'. Do NOT re-read test files using tools.
                 **If the tests or critique are unclear, or if you are unsure how to proceed, use the 'askHumanForInput' tool to ask for guidance.**`, // Needs state access
    model: deepseek({
      apiKey: apiKey,
      model: modelName,
    }),
    tools: allTools,
  })
}

export function createCriticAgent({
  allTools,
  apiKey,
  modelName,
}: AgentDependencies) {
  return createAgent({
    name: "Critic Agent",
    description:
      "Reviews code and/or tests for correctness and style, providing clear feedback.",
    system: async ({ network }: any) => {
      // System prompt needs network access
      const state: Partial<TddNetworkState> =
        network?.get("network_state") || {}
      const status = state.status
      let basePrompt = `You are a code reviewer agent. Your task is to review provided code and/or tests based on the original task description: "${state.task || "Unknown task"}".`
      let contentToReview = ""

      if (status === NetworkStatus.Enum.NEEDS_TEST_CRITIQUE) {
        basePrompt += `\nReview the following unit tests ('test.js'):`
        contentToReview =
          state.test_code || "Error: Test code not found in state."
      } else if (status === NetworkStatus.Enum.NEEDS_CODE_CRITIQUE) {
        basePrompt += `\nReview the following implementation code ('implementation.js') against the provided tests ('test.js'):`
        const implCode =
          state.implementation_code ||
          "Error: Implementation code not found in state."
        const testCode =
          state.test_code || "Error: Test code not found in state."
        contentToReview = `\n\n**Implementation (implementation.js):**\n\`\`\`javascript\n${implCode}\n\`\`\`\n\n**Tests (test.js):**\n\`\`\`javascript\n${testCode}\n\`\`\`\n`
      } else {
        basePrompt += `\nERROR: Critic agent called in unexpected state: ${status}. Cannot determine what to review.`
      }

      const finalPrompt = `${basePrompt}\n\n${contentToReview}\n\n**Review Output Format:** Provide clear feedback. \n- If everything is good, state **'Tests OK'** or **'Code OK'** or **'Approved'** or **'LGTM'**. Use clear approval terms.\n- If revisions are needed, clearly state **'Revision needed'** and explain the issues/errors/problems found.\n- **If you are unsure about the correctness or the review result is ambiguous, use the 'askHumanForInput' tool to request clarification before approving or requesting revision.**\nYour response will determine the next step in the workflow.`
      return finalPrompt
    },
    model: deepseek({
      apiKey: apiKey,
      model: modelName,
    }),
    tools: allTools.filter(
      (tool: AnyTool) =>
        tool.name !== "createOrUpdateFiles" && tool.name !== "terminal"
    ),
  })
}

// --- REMOVED onFinish Hook Functions --- //
// export async function TesterAgent_onFinish(...) { ... }
// export async function CodingAgent_onFinish(...) { ... }
// export async function CriticAgent_onFinish(...) { ... }

// --- REMOVED Helper Function for Critic Agent --- //
// function extractCritiqueData(...) { ... } // Moved to src/agents/critic/extractCritiqueData.ts
