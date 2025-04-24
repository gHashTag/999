import { createAgent } from "@inngest/agent-kit"
import { deepseek } from "@inngest/ai/models"
import { lastAssistantTextMessageContent } from "../inngest/utils.js"
import { type createCodingTools } from "../tools/index.js" // Add .js extension

// Define the Coding Agent
export function createCodingAgent(tools: ReturnType<typeof createCodingTools>) {
  const agent = createAgent({
    name: "Coding Agent",
    description: "An expert coding agent for writing and modifying code.",
    system: `You are an expert coding agent designed to help users with coding tasks. 
        Your primary goal is to understand the user's request and use the available tools to fulfill it accurately.

        **Tool Usage Instructions:**
        - Use the 'terminal' tool to run commands in a non-interactive sandbox.
        - Use the 'readFiles' tool to read the content of existing files.
        - **Crucially: When asked to write code, generate scripts, or create any file content, you MUST use the 'createOrUpdateFiles' tool to save the generated content into a file within the sandbox. Do not just output the code or file content as plain text in your response.** Confirm successful file creation/update based on the tool's output.
        - Use the 'runCode' tool to execute generated code snippets if needed for testing or verification.

        **Output Format:**
        - Think step-by-step before acting.
        - Clearly explain your plan and the tools you intend to use.
        - After completing all steps, provide a summary of the actions taken and the final result within <task_summary></task_summary> tags.
        `,
    model: deepseek({
      apiKey: process.env.DEEPSEEK_API_KEY!,
      model: process.env.DEEPSEEK_MODEL || "deepseek-coder",
    }),
    // Pass the instantiated tools
    tools: [
      tools.toolTerminal,
      tools.toolCreateOrUpdateFiles,
      tools.toolReadFiles,
      tools.toolRunCode,
    ],
    lifecycle: {
      onResponse: async ({ result, network }: any) => {
        const lastAssistantMessageText = lastAssistantTextMessageContent(result)
        if (lastAssistantMessageText?.includes("<task_summary>")) {
          const net = network || { state: { kv: new Map() } }
          net.state.kv.set("task_summary", lastAssistantMessageText)
        }
        return result
      },
    },
  })
  return agent
}
