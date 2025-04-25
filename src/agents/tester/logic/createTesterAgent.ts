import { createAgent } from "@inngest/agent-kit"
import { deepseek } from "@inngest/ai/models"
import type { AgentDependencies } from "../../../types/agents.js"

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
    // Removed lifecycle
  })
}
