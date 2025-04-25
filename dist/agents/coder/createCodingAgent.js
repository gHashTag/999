import { createAgent } from "@inngest/agent-kit";
import { deepseek } from "@inngest/ai/models";
export function createCodingAgent({ allTools, apiKey, modelName, log, // log is needed if used inside system prompt or hooks (removed hooks for now)
 }) {
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

                 Focus on writing only the implementation code in 'implementation.js'. Do NOT re-read test files using tools.
                 **If the tests or critique are unclear, or if you are unsure how to proceed, use the 'askHumanForInput' tool to ask for guidance.**`, // Needs state access
        model: deepseek({
            apiKey: apiKey,
            model: modelName,
        }),
        tools: allTools,
        // Removed lifecycle
    });
}
//# sourceMappingURL=createCodingAgent.js.map