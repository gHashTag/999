import { z } from "zod"
import { createTool } from "@inngest/agent-kit"
import { getSandbox } from "../inngest/utils.js" // Assuming utils is in the parent dir relative to tools

// Define Zod schemas for tool parameters
const terminalParamsSchema = z.object({
  command: z.string(),
})
const createOrUpdateFilesParamsSchema = z.object({
  files: z.array(
    z.object({
      path: z.string(),
      content: z.string(),
    })
  ),
})
const readFilesParamsSchema = z.object({
  files: z.array(z.string()),
})
const runCodeParamsSchema = z.object({
  code: z.string(),
})

// Define tools
// Note: The handlers need access to the sandboxId. This implies tools might need to be
// instantiated within the scope where sandboxId is available (e.g., inside codingAgentHandler)
// or passed the sandboxId dynamically. For simplicity in refactoring, we define them here
// but their handlers might need adjustment later depending on how sandboxId is managed.

export function createCodingTools(sandboxId: string) {
  const toolTerminal = createTool({
    name: "terminal",
    description: "Use the terminal to run commands",
    parameters: terminalParamsSchema,
    // @ts-ignore
    handler: async (
      params: z.infer<typeof terminalParamsSchema>,
      { step }: { step: any }
    ) => {
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
    // @ts-ignore
    handler: async (
      params: z.infer<typeof createOrUpdateFilesParamsSchema>,
      { step }: { step: any }
    ) => {
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
    // @ts-ignore
    handler: async (
      params: z.infer<typeof readFilesParamsSchema>,
      { step }: { step: any }
    ) => {
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
    // @ts-ignore
    handler: async (
      params: z.infer<typeof runCodeParamsSchema>,
      { step }: { step: any }
    ) => {
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

  return {
    toolTerminal,
    toolCreateOrUpdateFiles,
    toolReadFiles,
    toolRunCode,
  }
}
