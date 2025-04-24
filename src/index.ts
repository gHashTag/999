/* eslint-disable */
import "dotenv/config"

// Removed: import * as fs from "node:fs" // No longer needed after removing artifact download step
import { z } from "zod"
import { Inngest, EventPayload } from "inngest"

// Restore AgentKit core imports needed here
import { createAgent, createNetwork, createTool } from "@inngest/agent-kit"
// Restore model import
import { deepseek } from "@inngest/ai/models"

// Keep utils and sandbox imports
import { getSandbox, lastAssistantTextMessageContent } from "./inngest/utils.js"
import { Sandbox } from "@e2b/code-interpreter"

// Define the main event payload schema
const codingAgentEventSchema = z.object({
  input: z.string(),
})

type CodingAgentEvent = EventPayload<{
  name: "coding-agent/run"
  data: z.infer<typeof codingAgentEventSchema>
}>

// Initialize Inngest Client
const inngest = new Inngest({ id: "agentkit-coding-agent" })

// --- Main Handler --- //
async function codingAgentHandler({
  event,
  step,
}: {
  event: CodingAgentEvent
  step: any
}) {
  // @ts-ignore - Suppress TS2339 for logging (restored) - Commented out temporarily
  // console.log(`[HANDLER START] Event received: ${event.id}, Input: ${event.data?.input?.substring(0, 50) ?? "(data missing)"}...`);
  try {
    // ADDED: Wrap handler logic in try...catch
    console.log("[HANDLER START - SIMPLIFIED] Event received.") // Simplified log
    console.log("[HANDLER] Getting sandbox ID...")
    const sandboxId = await step.run("get-sandbox-id", async () => {
      console.log("[HANDLER STEP] Creating sandbox...")
      const sandbox = await Sandbox.create()
      console.log(`[HANDLER STEP] Sandbox created: ${sandbox.sandboxId}`)
      return sandbox.sandboxId
    })
    console.log(`[HANDLER] Got sandbox ID: ${sandboxId}`)

    // --- Define Tools Inline Again --- //
    console.log("[HANDLER] Defining tools...")
    const terminalParamsSchema = z.object({ command: z.string() })
    const createOrUpdateFilesParamsSchema = z.object({
      files: z.array(z.object({ path: z.string(), content: z.string() })),
    })
    const readFilesParamsSchema = z.object({ files: z.array(z.string()) })
    const runCodeParamsSchema = z.object({ code: z.string() })

    const toolTerminal = createTool({
      name: "terminal",
      description: "Use the terminal to run commands",
      parameters: terminalParamsSchema,
      handler: async (params, { step }) => {
        return await step?.run("terminal", async () => {
          const buffers = { stdout: "", stderr: "" }
          try {
            const sandbox = await getSandbox(sandboxId)
            if (!sandbox) throw new Error("Sandbox not found")
            const result = await sandbox.commands.run(params.command, {
              onStdout: (data: string) => {
                buffers.stdout += data
              },
              onStderr: (data: string) => {
                buffers.stderr += data
              },
            })
            return result.stdout
          } catch (e) {
            console.error(
              `Command failed: ${e} \nstdout: ${buffers.stdout}\nstderr: ${buffers.stderr}`
            )
            return `Command failed: ${e} \nstdout: ${buffers.stdout}\nstderr: ${buffers.stderr}`
          }
        })
      },
    })

    const toolCreateOrUpdateFiles = createTool({
      name: "createOrUpdateFiles",
      description: "Create or update files in the sandbox",
      parameters: createOrUpdateFilesParamsSchema,
      handler: async (params, { step }) => {
        return await step?.run("createOrUpdateFiles", async () => {
          try {
            const sandbox = await getSandbox(sandboxId)
            if (!sandbox) throw new Error("Sandbox not found")
            for (const file of params.files) {
              await sandbox.files.write(file.path, file.content)
            }
            return `Files created or updated: ${params.files.map(f => f.path).join(", ")}`
          } catch (e) {
            return "Error: " + e
          }
        })
      },
    })

    const toolReadFiles = createTool({
      name: "readFiles",
      description: "Read files from the sandbox",
      parameters: readFilesParamsSchema,
      handler: async (params, { step }) => {
        return await step?.run("readFiles", async () => {
          try {
            const sandbox = await getSandbox(sandboxId)
            if (!sandbox) throw new Error("Sandbox not found")
            const contents = []
            for (const file of params.files) {
              const content = await sandbox.files.read(file)
              contents.push({ path: file, content })
            }
            return JSON.stringify(contents)
          } catch (e) {
            return "Error: " + e
          }
        })
      },
    })

    const toolRunCode = createTool({
      name: "runCode",
      description: "Run the code in the sandbox",
      parameters: runCodeParamsSchema,
      handler: async (params, { step }) => {
        return await step?.run("runCode", async () => {
          try {
            const sandbox = await getSandbox(sandboxId)
            if (!sandbox) throw new Error("Sandbox not found")
            const result = await sandbox.runCode(params.code)
            return result.logs.stdout.join("\n")
          } catch (e) {
            return "Error: " + e
          }
        })
      },
    })

    // --- Define Agent Inline Again --- //
    console.log("[HANDLER] Defining agent...")
    const agent = createAgent({
      name: "Coding Agent",
      description: "An expert coding agent for writing and modifying code.",
      // Keep the improved system prompt
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
      tools: [
        toolTerminal,
        toolCreateOrUpdateFiles,
        toolReadFiles,
        toolRunCode,
      ],
      lifecycle: {
        onResponse: async ({ result, network }: any) => {
          const lastAssistantMessageText =
            lastAssistantTextMessageContent(result)
          if (lastAssistantMessageText?.includes("<task_summary>")) {
            const net = network || { state: { kv: new Map() } }
            net.state.kv.set("task_summary", lastAssistantMessageText)
          }
          return result
        },
      },
    })
    console.log("[HANDLER] Agent defined.")

    // --- Create Network with Single Agent Inline Again --- //
    console.log("[HANDLER] Defining network...")
    const network = createNetwork({
      name: "coding-agent-network", // Revert name or keep DevOps?
      agents: [agent],
      defaultModel: deepseek({
        // Router needs a model too
        apiKey: process.env.DEEPSEEK_API_KEY!,
        model: process.env.DEEPSEEK_MODEL || "deepseek-coder",
      }),
      maxIter: 15,
      // Simple router for single agent
      defaultRouter: async () => agent,
    })
    console.log("[HANDLER] Network defined.")

    // Validate event data
    if (!event.data) {
      throw new Error("Event data is missing!")
    }

    console.log(
      `[${agentFunction.opts.id}] Received event (repeated log):`,
      event.name
    )

    console.log("[HANDLER] Starting network run...")
    // Pass the input directly to the network
    // Original failing line: await network.run(event.data)
    // @ts-ignore - Restore ignore due to persistent TS2339 despite correct schema
    await network.run(event.data.input) // Corrected: Pass the input string
    console.log("[HANDLER] Network run finished.")

    console.log(
      `[${agentFunction.opts.id}] Network run completed (repeated log).`
    ) // Add completion log

    console.log("[HANDLER] download-artifact step skipped.") // ADDED log

    // Return summary
    const finalNet = network
    const summary = finalNet?.state?.kv?.get("task_summary")
    console.log(
      `[HANDLER END] Returning summary: ${summary ? summary.substring(0, 100) + "..." : "(no summary)"}`
    )
    return summary
  } catch (error) {
    console.error("[HANDLER ERROR] Uncaught error in handler:", error)
    // Optionally re-throw or return an error state
    throw error // Re-throw to let Inngest handle retries/failure state if configured
  }
}

// --- Inngest Function Definition --- //
const agentFunction = inngest.createFunction(
  {
    id: "Coding Agent", // Keep original ID
    retries: 0,
  },
  { event: "coding-agent/run" },
  codingAgentHandler
)

// --- Export for Server --- //
export { inngest, agentFunction } // Only export these

// --- HTTP Server (Entry Point) --- //
import { serve } from "inngest/express" // Import the serve adapter
import express from "express"

const app = express()
app.use(express.json()) // Middleware to parse JSON bodies

// Serve the Inngest function(s)
app.use("/api/inngest", serve({ client: inngest, functions: [agentFunction] }))

const PORT = process.env.PORT || 3000

// Only start the server if not in a test environment
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(
      `[NODE-APP] Inngest server listening on http://localhost:${PORT}/api/inngest`
    )
  })
}
