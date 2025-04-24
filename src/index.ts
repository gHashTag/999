/* eslint-disable */
import "dotenv/config"

// import * as fs from "node:fs" // Removed unused import
// import * as path from "node:path" // Removed unused import

import { z } from "zod"
import { Inngest, EventPayload } from "inngest"
import { createAgent, createTool } from "@inngest/agent-kit"
import { deepseek } from "@inngest/ai/models"
import { getSandbox, lastAssistantTextMessageContent } from "./inngest/utils.js"
import { Sandbox } from "@e2b/code-interpreter"
import { createDevOpsNetwork } from "./network.js" // Import the TDD network

// Define the main event payload schema
const codingAgentEventSchema = z.object({
  input: z.string(),
})

type CodingAgentEvent = EventPayload<{
  name: "coding-agent/run"
  data: z.infer<typeof codingAgentEventSchema>
}>

// Initialize Inngest Client
const inngest = new Inngest({ id: "agentkit-tdd-agent" })

// --- Main Handler --- //
let sandboxId: string | null = null

async function codingAgentHandler({
  event,
  step, // Use any type
}: {
  event: CodingAgentEvent
  step: any // Use any for step type
}) {
  sandboxId = null
  try {
    console.log("[HANDLER START] TDD Event received.")
    console.log("[HANDLER] Getting sandbox ID...")
    // Assign the global sandboxId variable
    sandboxId = await step.run("get-sandbox-id", async () => {
      console.log("[HANDLER STEP] Creating sandbox...")
      const sandbox = await Sandbox.create()
      console.log(`[HANDLER STEP] Sandbox created: ${sandbox.sandboxId}`)
      return sandbox.sandboxId
    })
    console.log(`[HANDLER] Got sandbox ID: ${sandboxId}`)

    // --- Define Tools Inline Again --- //
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
        // Access sandboxId from the outer scope (closure)
        const currentSandboxId = sandboxId // Use the variable from codingAgentHandler scope
        return await step?.run("terminal", async () => {
          // Function inside run doesn't need params now
          const buffers = { stdout: "", stderr: "" }
          try {
            if (!currentSandboxId) throw new Error("Sandbox ID is null")
            const sandbox = await getSandbox(currentSandboxId)
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
        const currentSandboxId = sandboxId
        return await step?.run("createOrUpdateFiles", async () => {
          try {
            if (!currentSandboxId) throw new Error("Sandbox ID is null")
            const sandbox = await getSandbox(currentSandboxId)
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
        const currentSandboxId = sandboxId
        return await step?.run("readFiles", async () => {
          try {
            if (!currentSandboxId) throw new Error("Sandbox ID is null")
            const sandbox = await getSandbox(currentSandboxId)
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
        const currentSandboxId = sandboxId
        if (step && typeof step.run === "function") {
          return await step.run("runCode", async () => {
            try {
              if (!currentSandboxId) throw new Error("Sandbox ID is null")
              const sandbox = await getSandbox(currentSandboxId)
              if (!sandbox) throw new Error("Sandbox not found")
              const result = await sandbox.runCode(params.code)
              return result.logs.stdout.join("\n")
            } catch (e) {
              return "Error: " + e
            }
          })
        } else {
          console.error("Step context not available in toolRunCode handler")
          return "Error: Step context is required to run code."
        }
      },
    })

    const allTools = [
      toolTerminal,
      toolCreateOrUpdateFiles,
      toolReadFiles,
      toolRunCode,
    ]

    // --- Define Agents --- //
    const testerAgent = createAgent({
      name: "Tester Agent",
      description: "Writes unit tests based on a task description.",
      system: `You are a QA engineer agent. Your task is to write simple unit tests (e.g., using Node.js 'assert') for a given function description. 
               Use the 'createOrUpdateFiles' tool to save the test code into a file named 'test.js'. 
               Do not write the implementation code itself. Output the test code in the specified file.`,
      model: deepseek({
        apiKey: process.env.DEEPSEEK_API_KEY!,
        model: process.env.DEEPSEEK_MODEL || "deepseek-coder",
      }),
      tools: allTools,
      // Update state after test creation
      lifecycle: {
        onResponse: async ({ result, network }: any) => {
          if (network?.state?.kv) {
            const state = network.state.kv.get("network_state") || {}
            // Revert to placeholder for now due to logging/hook issues
            /* try {
              const sandboxIdFromState = state.sandboxId;
              if (!sandboxIdFromState) throw new Error("Sandbox ID not found in state for TesterAgent hook");
              console.log(`[TesterAgent Lifecycle] Reading test.js from sandbox ${sandboxIdFromState}...`);
              const fileContent = await step.run("read-test-code", async () => {
                 const sandbox = await getSandbox(sandboxIdFromState);
                 if (!sandbox) throw new Error("Sandbox not found for reading test code");
                 return await sandbox.files.read('test.js');
              });
              state.test_code = fileContent;
              console.log(`[TesterAgent Lifecycle] Stored test code content in state.`);
            } catch (e) {
              console.error(`[TesterAgent Lifecycle] Error reading test.js:`, e);
              state.test_code = `Error reading test.js: ${e instanceof Error ? e.message : e}`;
            } */
            state.test_code = "test.js" // Reverted placeholder
            state.status = "NEEDS_CODE"
            network.state.kv.set("network_state", state)
            // Simplified log message
            console.log("[TesterAgent Lifecycle] State updated to NEEDS_CODE.")
          }
          return result
        },
      },
    })

    const codingAgent = createAgent({
      name: "Coding Agent",
      description: "Writes implementation code based on task and tests.",
      system: `You are a software developer agent. Your task is to write the implementation code for a function based on the provided task description and unit tests. 
               Read the tests from 'test.js' using the 'readFiles' tool. 
               Write the implementation code and save it into 'implementation.js' using the 'createOrUpdateFiles' tool.`,
      model: deepseek({
        apiKey: process.env.DEEPSEEK_API_KEY!,
        model: process.env.DEEPSEEK_MODEL || "deepseek-coder",
      }),
      tools: allTools,
      // Update state after code creation
      lifecycle: {
        onResponse: async ({ result, network }: any) => {
          if (network?.state?.kv) {
            const state = network.state.kv.get("network_state") || {}
            // Revert to placeholder
            /* const implementationFilePath = 'implementation.js';
            try {
              const sandboxIdFromState = state.sandboxId;
              if (!sandboxIdFromState) throw new Error("Sandbox ID not found in state for CodingAgent hook");
              console.log(`[CodingAgent Lifecycle] Reading ${implementationFilePath} from sandbox ${sandboxIdFromState}...`);
              const fileContent = await step.run("read-implementation-code", async () => {
                 const sandbox = await getSandbox(sandboxIdFromState);
                 if (!sandbox) throw new Error("Sandbox not found for reading implementation code");
                 return await sandbox.files.read(implementationFilePath);
              });
              state.current_code = fileContent;
              console.log(`[CodingAgent Lifecycle] Stored implementation code content in state.`);
            } catch (e) {
               console.error(`[CodingAgent Lifecycle] Error reading ${implementationFilePath}:`, e);
               state.current_code = `Error reading ${implementationFilePath}: ${e instanceof Error ? e.message : e}`;
            } */
            state.current_code = "implementation.js" // Reverted placeholder
            state.status = "NEEDS_CRITIQUE"
            network.state.kv.set("network_state", state)
            // Simplified log message
            console.log(
              "[CodingAgent Lifecycle] State updated to NEEDS_CRITIQUE."
            )
          }
          return result
        },
      },
    })

    const criticAgent = createAgent({
      name: "Critic Agent",
      description: "Reviews code and tests for correctness and style.",
      system: `You are a code reviewer agent. Your task is to review the provided implementation code ('implementation.js') and test code ('test.js') based on the original task description. 
               Use the 'readFiles' tool to read both files. 
               Provide your feedback as a critique.`,
      model: deepseek({
        apiKey: process.env.DEEPSEEK_API_KEY!,
        model: process.env.DEEPSEEK_MODEL || "deepseek-coder",
      }),
      tools: allTools, // Critic might need to read files
      // Update state after critique
      lifecycle: {
        onResponse: async ({ result, network }: any) => {
          const lastAssistantMessageText =
            lastAssistantTextMessageContent(result)
          if (network?.state?.kv) {
            const state = network.state.kv.get("network_state") || {}
            // Log state BEFORE updating to COMPLETED
            console.log(
              "[CriticAgent Lifecycle] State BEFORE completion:",
              state
            )
            state.status = "COMPLETED"
            state.critique = lastAssistantMessageText || "No critique provided."
            network.state.kv.set("network_state", state)
            // Log state AFTER updating to COMPLETED
            console.log(
              "[CriticAgent Lifecycle] State AFTER completion:",
              state
            )
            console.log("[CriticAgent Lifecycle] State updated to COMPLETED")
          }
          return result
        },
      },
    })

    // --- Create TDD Network --- //
    const devOpsNetwork = createDevOpsNetwork(
      testerAgent,
      codingAgent,
      criticAgent
    )

    // --- Initialize State and Run Network --- //
    console.log("[HANDLER] Initializing TDD network state...")
    const initialTask = (event.data as any)?.input ?? ""
    if (!initialTask) {
      throw new Error("Input task is missing in the event data.")
    }
    const initialState = {
      task: initialTask,
      status: "NEEDS_TEST",
      sandboxId: sandboxId,
    }
    devOpsNetwork.state.kv.set("network_state", initialState)
    console.log("[HANDLER] Starting TDD network run...")
    await devOpsNetwork.run(initialTask)
    console.log("[HANDLER] TDD Network run finished.")

    // --- Cleanup or Read Final State --- //
    const finalState = devOpsNetwork.state.kv.get("network_state")
    console.log("[HANDLER] Final Network State:", finalState)

    // Cleanup using sandboxId from handler scope
    // const currentSandboxId = sandboxId; // Remove unused variable
    // FIX: Temporarily disable killing the sandbox to allow inspection
    /*
    if (currentSandboxId) {
      console.log(`[HANDLER] Killing sandbox ${currentSandboxId}...`)
      await step.run("kill-sandbox", async () => {
        if (!currentSandboxId) {
          console.warn("[HANDLER STEP] Sandbox ID became null before killing.")
          return
        }
        const sandbox = await getSandbox(currentSandboxId)
        if (sandbox) {
          await sandbox.kill()
          console.log(`[HANDLER STEP] Sandbox ${currentSandboxId} killed.`)
        } else {
          console.warn(
            `[HANDLER STEP] Sandbox ${currentSandboxId} not found for killing.`
          )
        }
      })
    }
    */
    console.log("[HANDLER END] Event processing complete.")
    return { event, finalState }
  } catch (error) {
    console.error("[HANDLER ERROR] An error occurred:", error)
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
    throw error
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
  { id: "coding-agent-tdd-function", name: "TDD Coding Agent Function" }, // Updated ID and Name
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

const APP_PORT = process.env.APP_PORT || 8484 // Changed default port to 8484

// Only start the server if not in a test environment
if (process.env.NODE_ENV !== "test") {
  app.listen(APP_PORT, () => {
    console.log(
      `[NODE-APP] Inngest server listening on http://localhost:${APP_PORT}/api/inngest` // Use APP_PORT
    )
  })
}
