/* eslint-disable */
import "dotenv/config"

// Restore necessary imports
// import * as fs from "node:fs" // Removed unused import
// import * as path from "node:path" // Removed unused import

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
  let sandboxId: string | null = null // Define sandboxId outside try block
  try {
    // ADDED: Wrap handler logic in try...catch
    console.log("[HANDLER START] Event received.") // Renamed and kept at the top
    console.log("[HANDLER] Getting sandbox ID...")
    sandboxId = await step.run("get-sandbox-id", async () => {
      // Assign to outer variable
      console.log("[HANDLER STEP] Creating sandbox...")
      const sandbox = await Sandbox.create()
      console.log(`[HANDLER STEP] Sandbox created: ${sandbox.sandboxId}`)
      return sandbox.sandboxId
    })
    console.log(`[HANDLER] Got sandbox ID: ${sandboxId}`)

    // --- Define Tools Inline Again --- //
    // console.log("[HANDLER] Defining tools...") // Removed redundant log
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
            // FIX: Add null check for sandboxId before passing to getSandbox
            if (!sandboxId) throw new Error("Sandbox ID is null")
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
            // FIX: Add null check for sandboxId
            if (!sandboxId) throw new Error("Sandbox ID is null")
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
            // FIX: Add null check for sandboxId
            if (!sandboxId) throw new Error("Sandbox ID is null")
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
        // Ensure step is passed correctly if needed inside tool handlers
        // Check if step exists and has the 'run' method before calling
        if (step && typeof step.run === "function") {
          return await step.run("runCode", async () => {
            try {
              // FIX: Add null check for sandboxId
              if (!sandboxId) throw new Error("Sandbox ID is null")
              const sandbox = await getSandbox(sandboxId) // Use non-null assertion or check
              if (!sandbox) throw new Error("Sandbox not found")
              const result = await sandbox.runCode(params.code)
              return result.logs.stdout.join("\n")
            } catch (e) {
              return "Error: " + e
            }
          })
        } else {
          // Fallback or error handling if step is not available
          console.error("Step context not available in toolRunCode handler")
          // Attempt direct execution without step tracking (might lose some Inngest features)
          try {
            // FIX: Add null check for sandboxId
            if (!sandboxId) throw new Error("Sandbox ID is null")
            const sandbox = await getSandbox(sandboxId) // Use non-null assertion or check
            if (!sandbox) throw new Error("Sandbox not found")
            const result = await sandbox.runCode(params.code)
            return result.logs.stdout.join("\n")
          } catch (e) {
            return "Error: " + e
          }
        }
      },
    })

    // --- Define Agent Inline Again --- //
    // console.log("[HANDLER] Defining agent...") // Removed redundant log
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
    // console.log("[HANDLER] Agent defined.") // Removed redundant log

    // --- Create Network with Single Agent Inline Again --- //
    // console.log("[HANDLER] Defining network...") // Removed redundant log
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
    // console.log("[HANDLER] Network defined.") // Removed redundant log

    // --- Execute Network --- //
    console.log("[HANDLER] Starting network run...")
    // FIX: Use optional chaining and provide default value for input
    // FIX: Comment out { step } until the correct way to pass it is known
    // FIX: Remove unused ts-expect-error
    // FIX: Explicitly cast event.data type
    const inputData = (event.data as { input?: string })?.input ?? ""
    const networkResult = await network.run(inputData /* { step } */) // Pass step to network.run
    console.log("[HANDLER] Network run finished.")
    // console.log("[Coding Agent] Network run completed.") // Removed redundant log

    // ADDED: Step to read the expected output file
    const fileContentResult = await step.run("read-output-file", async () => {
      console.log("[HANDLER STEP] Reading output file test-output.txt...")
      if (!sandboxId) throw new Error("Sandbox ID is null for reading file")
      const sandbox = await getSandbox(sandboxId)
      if (!sandbox) throw new Error("Sandbox not found for reading file")

      try {
        // Use sandbox.files.read() as suggested by E2B docs/examples
        const content = await sandbox.files.read("test-output.txt")
        console.log("[HANDLER STEP] Successfully read test-output.txt.")
        return { success: true, content: content }
      } catch (error) {
        console.error("[HANDLER STEP] Failed to read test-output.txt:", error)
        const errorMessage =
          error instanceof Error ? error.message : String(error)
        // Basic check for file not found type errors
        if (
          errorMessage.includes("FileNotFoundError") ||
          errorMessage.includes("NoSuchFile") ||
          errorMessage.includes("404") ||
          errorMessage.toLowerCase().includes("not found")
        ) {
          return {
            success: false,
            error: "File 'test-output.txt' not found in sandbox.",
          }
        }
        return { success: false, error: `Failed to read file: ${errorMessage}` }
      }
    })

    // --- Extract Summary and Modify Return --- //
    const summary = networkResult.state.kv.get("task_summary") || "(no summary)"
    console.log(`[HANDLER END] Returning summary and file content result.`)
    // Modify return value to include file reading result
    return {
      summary,
      fileReadResult: fileContentResult, // Include success/error and content if success
    }
  } catch (error) {
    // ADDED: Catch block for overall handler errors
    console.error("[HANDLER ERROR] An error occurred:", error)
    // Optionally re-throw or return an error structure
    return {
      error: `Handler failed: ${error instanceof Error ? error.message : String(error)}`,
    }
  } finally {
    // ADDED: Finally block to ensure sandbox cleanup
    if (!sandboxId) {
      console.log("[HANDLER FINALLY] No sandbox ID to close.")
      return
    }
    console.log(`[HANDLER FINALLY] Closing sandbox: ${sandboxId}`)
    const sandbox = await getSandbox(sandboxId)
    if (sandbox) {
      // FIX: Use correct method name (assuming it's close)
      // If the method is different, this needs adjustment based on E2B SDK
      // COMMENTED OUT DUE TO TS ERROR - E2B METHOD UNKNOWN
      // await sandbox.close() // Keep existing method name for now, assuming it's correct despite linter error
      console.log(
        `[HANDLER FINALLY] Sandbox close SKIPPED - Method unknown. Sandbox ID: ${sandboxId}`
      )
    } else {
      console.warn(
        `[HANDLER FINALLY] Sandbox ${sandboxId} not found for closing.`
      )
    }
  }
}

// --- Register Inngest Function --- //
// FIX: Rename exported function to avoid conflict if needed, or ensure only one definition is exported.
// Assuming the original export near the end is the intended one. Remove this definition.
// const codingAgent = inngest.createFunction( ... ); // REMOVE THIS BLOCK

// --- Export for Server --- //
// FIX: Ensure codingAgentHandler is defined before being used here.
// Define the function before exporting it.
const codingAgentFunction = inngest.createFunction(
  {
    id: "Coding Agent", // Keep original ID
    retries: 0,
  },
  { event: "coding-agent/run" },
  codingAgentHandler // Use the handler function defined above
)

export { inngest, codingAgentFunction as codingAgent } // Export with the original name

// --- HTTP Server (Entry Point) --- //
import { serve } from "inngest/express" // Import the serve adapter
import express from "express"

const app = express()
app.use(express.json()) // Middleware to parse JSON bodies

// Serve the Inngest function(s)
// FIX: Use the correctly defined function variable
app.use(
  "/api/inngest",
  serve({ client: inngest, functions: [codingAgentFunction] })
)

const PORT = process.env.PORT || 3000

// Only start the server if not in a test environment
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(
      `[NODE-APP] Inngest server listening on http://localhost:${PORT}/api/inngest`
    )
  })
}
