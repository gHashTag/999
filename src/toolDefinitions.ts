import { z } from "zod"
import { createTool } from "@inngest/agent-kit"
import * as fs from "node:fs"
import * as path from "node:path"
import { Sandbox } from "@e2b/code-interpreter"

// Type for the logger function (assuming it's passed)
// Consider defining this more centrally if used elsewhere
type LoggerFunc = (
  level: "info" | "warn" | "error",
  stepName: string,
  message: string,
  data?: object
) => void

// Type for the getSandbox function (assuming it's passed)
type GetSandboxFunc = (sandboxId: string) => Promise<Sandbox | null>

// --- Tool Schema Definitions --- //
const terminalParamsSchema = z.object({ command: z.string() })
const createOrUpdateFilesParamsSchema = z.object({
  files: z.array(z.object({ path: z.string(), content: z.string() })),
})
const readFilesParamsSchema = z.object({ files: z.array(z.string()) })
const runCodeParamsSchema = z.object({ code: z.string() })
const processArtifactParamsSchema = z.object({
  artifactPath: z.string().describe("Local path to the .tar.gz artifact file"),
  fileToRead: z
    .string()
    .describe("Path to the file to read inside the archive (e.g., 'test.js')"),
})

// --- Tool Creation Functions --- //

export function createTerminalTool(
  log: LoggerFunc,
  getSandbox: GetSandboxFunc,
  eventId: string,
  sandboxId: string | null
) {
  return createTool({
    name: "terminal",
    description: "Use the terminal to run commands",
    parameters: terminalParamsSchema,
    handler: async (params, { step }) => {
      const currentSandboxId = sandboxId
      const toolStepName = "TOOL_terminal"
      log("info", `${toolStepName}_START`, "Executing terminal command.", {
        eventId,
        currentSandboxId,
        command: params.command,
      })
      return await step?.run(toolStepName, async () => {
        const buffers = { stdout: "", stderr: "" }
        try {
          if (!currentSandboxId)
            throw new Error("Sandbox ID is null for terminal tool")
          const sandbox = await getSandbox(currentSandboxId)
          if (!sandbox)
            throw new Error(`Sandbox not found for ID: ${currentSandboxId}`)
          log(
            "info",
            `${toolStepName}_EXEC_START`,
            "Running command in sandbox.",
            { eventId, currentSandboxId, command: params.command }
          )
          const result = await sandbox.commands.run(params.command, {
            onStdout: (data: string) => {
              buffers.stdout += data
            },
            onStderr: (data: string) => {
              buffers.stderr += data
            },
          })
          log("info", `${toolStepName}_EXEC_END`, "Command finished.", {
            eventId,
            currentSandboxId,
            exitCode: result.exitCode,
            stdoutLen: result.stdout.length,
            stderrLen: result.stderr.length,
          })
          return result.stdout
        } catch (e: any) {
          log("error", `${toolStepName}_ERROR`, "Terminal command failed.", {
            eventId,
            currentSandboxId,
            command: params.command,
            error: e.message,
            stack: e.stack,
            stdout: buffers.stdout,
            stderr: buffers.stderr,
          })
          return `Command failed: ${e.message} \nstdout: ${buffers.stdout}\nstderr: ${buffers.stderr}`
        }
      })
    },
  })
}

export function createCreateOrUpdateFilesTool(
  log: LoggerFunc,
  getSandbox: GetSandboxFunc,
  eventId: string,
  sandboxId: string | null
) {
  return createTool({
    name: "createOrUpdateFiles",
    description:
      "Create or update files in the sandbox and return an artifact path.",
    parameters: createOrUpdateFilesParamsSchema,
    handler: async (params, { step }) => {
      const currentSandboxId = sandboxId
      const toolStepName = "TOOL_createOrUpdateFiles"
      const filePaths = params.files.map(f => f.path)
      log(
        "info",
        `${toolStepName}_START`,
        "Creating/updating files and artifact.",
        { eventId, currentSandboxId, files: filePaths }
      )
      return await step?.run(toolStepName, async () => {
        try {
          if (!currentSandboxId)
            throw new Error("Sandbox ID is null for createOrUpdateFiles tool")
          const sandbox = await getSandbox(currentSandboxId)
          if (!sandbox)
            throw new Error(`Sandbox not found for ID: ${currentSandboxId}`)

          const writtenFilePaths: string[] = []
          log(
            "info",
            `${toolStepName}_WRITE_START`,
            "Writing files to sandbox.",
            { eventId, currentSandboxId, files: filePaths }
          )
          for (const file of params.files) {
            await sandbox.files.write(file.path, file.content)
            writtenFilePaths.push(file.path)
          }
          log("info", `${toolStepName}_WRITE_END`, "Files written.", {
            eventId,
            currentSandboxId,
            writtenFiles: writtenFilePaths,
          })

          if (writtenFilePaths.length === 0) {
            log(
              "warn",
              `${toolStepName}_NO_FILES`,
              "No files were specified to write.",
              { eventId, currentSandboxId }
            )
            return {
              message: "No files specified to write.",
              artifactPath: null,
            }
          }

          log(
            "info",
            `${toolStepName}_ARCHIVE_START`,
            "Creating artifact for written files...",
            { eventId, currentSandboxId, filesToArchive: writtenFilePaths }
          )
          const archiveCommand = `
                      TIMESTAMP=$(date -u +'%Y-%m-%dT%H:%M:%S.%NZ')
                      ARTIFACT_FILENAME="artifact-$TIMESTAMP.tar.gz"
                      REMOTE_ARCHIVE_PATH="/home/user/$ARTIFACT_FILENAME"
                      tar -czvf "$REMOTE_ARCHIVE_PATH" ${writtenFilePaths.map(p => `"${p}"`).join(" ")} || echo "Error archiving"
                      echo "$REMOTE_ARCHIVE_PATH"
                    `
          log(
            "info",
            `${toolStepName}_ARCHIVE_CMD_RUN`,
            "Running archive command...",
            { eventId, currentSandboxId }
          )
          const execResult = await sandbox.commands.run(archiveCommand)

          const stdoutLines = execResult.stdout.trim().split("\n")
          const remoteArchivePath = stdoutLines.find(
            line =>
              line.startsWith("/home/user/artifact-") &&
              line.endsWith(".tar.gz")
          )

          if (!remoteArchivePath || execResult.stderr) {
            log(
              "error",
              `${toolStepName}_ARCHIVE_CMD_ERROR`,
              "Archive creation failed or path not found.",
              {
                eventId,
                currentSandboxId,
                stdout: execResult.stdout,
                stderr: execResult.stderr,
              }
            )
            throw new Error(
              `Failed to create archive or find path: ${execResult.stderr || "stdout did not contain expected path"}`
            )
          }
          log(
            "info",
            `${toolStepName}_ARCHIVE_CMD_SUCCESS`,
            "Remote archive created.",
            { eventId, currentSandboxId, remoteArchivePath }
          )

          log(
            "info",
            `${toolStepName}_READ_ARTIFACT_START`,
            "Reading artifact content...",
            { eventId, currentSandboxId, remoteArchivePath }
          )
          const archiveBuffer = await sandbox.files.read(remoteArchivePath)
          log(
            "info",
            `${toolStepName}_READ_ARTIFACT_END`,
            "Artifact content read.",
            { eventId, currentSandboxId, bytes: archiveBuffer.length }
          )

          const localArtifactDir = "artifacts"
          const localPath = path.join(
            localArtifactDir,
            path.basename(remoteArchivePath)
          )
          log(
            "info",
            `${toolStepName}_SAVE_ARTIFACT_START`,
            "Saving artifact locally...",
            { eventId, localPath }
          )
          await fs.promises.mkdir(localArtifactDir, { recursive: true })
          await fs.promises.writeFile(localPath, archiveBuffer)
          log(
            "info",
            `${toolStepName}_SAVE_ARTIFACT_END`,
            "Artifact saved locally.",
            { eventId, localPath }
          )

          log(
            "info",
            `${toolStepName}_CLEANUP_START`,
            "Cleaning up remote archive.",
            { eventId, currentSandboxId, remoteArchivePath }
          )
          sandbox.commands
            .run(`rm -f ${remoteArchivePath}`)
            .then(() =>
              log(
                "info",
                `${toolStepName}_CLEANUP_SUCCESS`,
                "Remote archive cleaned up.",
                { eventId, currentSandboxId }
              )
            )
            .catch(e =>
              log(
                "warn",
                `${toolStepName}_CLEANUP_ERROR`,
                "Cleanup archive failed.",
                { eventId, currentSandboxId, error: e.message }
              )
            )

          log(
            "info",
            `${toolStepName}_SUCCESS`,
            "Tool finished successfully.",
            {
              eventId,
              currentSandboxId,
              localArtifactPath: localPath,
              message: `Files created/updated: ${writtenFilePaths.join(", ")}`,
            }
          )
          return {
            message: `Files created/updated: ${writtenFilePaths.join(", ")}`,
            artifactPath: localPath,
          }
        } catch (e: any) {
          log(
            "error",
            `${toolStepName}_ERROR`,
            "Error in createOrUpdateFiles tool.",
            { eventId, currentSandboxId, error: e.message, stack: e.stack }
          )
          return {
            message: `Error creating/updating files or artifact: ${e.message}`,
            artifactPath: null,
            error: true,
          }
        }
      })
    },
  })
}

export function createReadFilesTool(
  log: LoggerFunc,
  getSandbox: GetSandboxFunc,
  eventId: string,
  sandboxId: string | null
) {
  return createTool({
    name: "readFiles",
    description: "Read files from the sandbox",
    parameters: readFilesParamsSchema,
    handler: async (params, { step }) => {
      const currentSandboxId = sandboxId
      const toolStepName = "TOOL_readFiles"
      const filesToRead = params.files
      log("info", `${toolStepName}_START`, "Reading files from sandbox.", {
        eventId,
        currentSandboxId,
        files: filesToRead,
      })
      return await step?.run(toolStepName, async () => {
        try {
          if (!currentSandboxId)
            throw new Error("Sandbox ID is null for readFiles tool")
          const sandbox = await getSandbox(currentSandboxId)
          if (!sandbox)
            throw new Error(`Sandbox not found for ID: ${currentSandboxId}`)
          const contents = []
          for (const file of filesToRead) {
            log(
              "info",
              `${toolStepName}_READING_FILE`,
              "Reading file content.",
              { eventId, currentSandboxId, file }
            )
            const content = await sandbox.files.read(file)
            contents.push({ path: file, content })
          }
          const resultString = JSON.stringify(contents)
          log("info", `${toolStepName}_SUCCESS`, "Files read successfully.", {
            eventId,
            currentSandboxId,
            resultLength: resultString.length,
          })
          return resultString
        } catch (e: any) {
          log("error", `${toolStepName}_ERROR`, "Error reading files.", {
            eventId,
            currentSandboxId,
            files: filesToRead,
            error: e.message,
            stack: e.stack,
          })
          return "Error: " + e.message
        }
      })
    },
  })
}

export function createRunCodeTool(
  log: LoggerFunc,
  getSandbox: GetSandboxFunc,
  eventId: string,
  sandboxId: string | null
) {
  return createTool({
    name: "runCode",
    description: "Run the code in the sandbox",
    parameters: runCodeParamsSchema,
    handler: async (params, { step }) => {
      const currentSandboxId = sandboxId
      const toolStepName = "TOOL_runCode"
      log("info", `${toolStepName}_START`, "Running code in sandbox.", {
        eventId,
        currentSandboxId,
        codeLength: params.code.length,
      })
      if (step && typeof step.run === "function") {
        return await step.run(toolStepName, async () => {
          try {
            if (!currentSandboxId)
              throw new Error("Sandbox ID is null for runCode tool")
            const sandbox = await getSandbox(currentSandboxId)
            if (!sandbox)
              throw new Error(`Sandbox not found for ID: ${currentSandboxId}`)
            const result = await sandbox.runCode(params.code)
            const stdout = result.logs.stdout.join("\n")
            const stderr = result.logs.stderr.join("\n")
            log("info", `${toolStepName}_SUCCESS`, "Code run finished.", {
              eventId,
              currentSandboxId,
              stdoutLen: stdout.length,
              stderrLen: stderr.length,
            })
            return stdout
          } catch (e: any) {
            log("error", `${toolStepName}_ERROR`, "Error running code.", {
              eventId,
              currentSandboxId,
              error: e.message,
              stack: e.stack,
            })
            return "Error: " + e.message
          }
        })
      } else {
        log("error", `${toolStepName}_NO_STEP`, "Step context not available.", {
          eventId,
          currentSandboxId,
        })
        return "Error: Step context is required to run code."
      }
    },
  })
}

export function createProcessArtifactTool(
  log: LoggerFunc,
  getSandbox: GetSandboxFunc,
  eventId: string,
  sandboxId: string | null
) {
  return createTool({
    name: "processArtifact",
    description:
      "Uploads a local .tar.gz artifact to the sandbox, extracts it, and reads a specified file from within.",
    parameters: processArtifactParamsSchema,
    handler: async (params, { step }) => {
      const currentSandboxId = sandboxId
      const toolStepName = "TOOL_processArtifact"
      log("info", `${toolStepName}_START`, "Processing artifact.", {
        eventId,
        currentSandboxId,
        artifactPath: params.artifactPath,
        fileToRead: params.fileToRead,
      })
      return await step?.run(toolStepName, async () => {
        try {
          if (!currentSandboxId)
            throw new Error("Sandbox ID is null for processArtifact tool")
          log("info", `${toolStepName}_GET_SANDBOX`, "Getting sandbox...", {
            eventId,
            currentSandboxId,
          })
          const sandbox = await getSandbox(currentSandboxId)
          if (!sandbox)
            throw new Error(`Sandbox not found for ID: ${currentSandboxId}`)

          const uniqueSuffix = Date.now()
          const remoteArchivePath = `/tmp/artifact_${uniqueSuffix}.tar.gz`
          const remoteExtractDir = `/tmp/extracted_${uniqueSuffix}`

          log("info", `${toolStepName}_UPLOAD_START`, "Uploading artifact...", {
            eventId,
            currentSandboxId,
            localPath: params.artifactPath,
            remotePath: remoteArchivePath,
          })
          const localArtifactBuffer = await fs.promises.readFile(
            params.artifactPath
          )
          await sandbox.files.write(remoteArchivePath, localArtifactBuffer)
          log("info", `${toolStepName}_UPLOAD_END`, "Upload complete.", {
            eventId,
            currentSandboxId,
          })

          log(
            "info",
            `${toolStepName}_MKDIR_START`,
            "Creating extract directory...",
            { eventId, currentSandboxId, remoteExtractDir }
          )
          await sandbox.commands.run(`mkdir -p ${remoteExtractDir}`)
          log(
            "info",
            `${toolStepName}_MKDIR_END`,
            "Extract directory created.",
            { eventId, currentSandboxId }
          )

          const extractCommand = `tar -xvzf ${remoteArchivePath} -C ${remoteExtractDir}`
          log(
            "info",
            `${toolStepName}_EXTRACT_START`,
            "Extracting artifact...",
            { eventId, currentSandboxId, command: extractCommand }
          )
          const extractResult = await sandbox.commands.run(extractCommand)
          if (extractResult.stderr) {
            log(
              "warn",
              `${toolStepName}_EXTRACT_WARN`,
              "Extraction warnings/errors.",
              { eventId, currentSandboxId, stderr: extractResult.stderr }
            )
          }
          log("info", `${toolStepName}_EXTRACT_END`, "Extraction complete.", {
            eventId,
            currentSandboxId,
          })

          const fileToReadPath = path.join(remoteExtractDir, params.fileToRead)
          log(
            "info",
            `${toolStepName}_READ_START`,
            "Reading file from extracted archive...",
            { eventId, currentSandboxId, fileToReadPath }
          )
          const content = await sandbox.files.read(fileToReadPath)
          log("info", `${toolStepName}_READ_END`, "File read successfully.", {
            eventId,
            currentSandboxId,
            contentLen: content.length,
          })

          log(
            "info",
            `${toolStepName}_CLEANUP_START`,
            "Cleaning up remote files.",
            { eventId, currentSandboxId }
          )
          sandbox.commands
            .run(`rm -rf ${remoteArchivePath} ${remoteExtractDir}`)
            .then(() =>
              log(
                "info",
                `${toolStepName}_CLEANUP_SUCCESS`,
                "Remote files cleaned up.",
                { eventId, currentSandboxId }
              )
            )
            .catch(e =>
              log("warn", `${toolStepName}_CLEANUP_ERROR`, "Cleanup failed.", {
                eventId,
                currentSandboxId,
                error: e.message,
              })
            )

          log(
            "info",
            `${toolStepName}_SUCCESS`,
            "Artifact processed successfully.",
            { eventId, currentSandboxId }
          )
          return content
        } catch (e: any) {
          log("error", `${toolStepName}_ERROR`, "Error processing artifact.", {
            eventId,
            currentSandboxId,
            error: e.message,
            stack: e.stack,
          })
          return `Error processing artifact: ${e.message}`
        }
      })
    },
  })
}

// Function to assemble all tools, accepting dependencies
export function getAllTools(
  log: LoggerFunc,
  getSandbox: GetSandboxFunc,
  eventId: string,
  sandboxId: string | null
) {
  return [
    createTerminalTool(log, getSandbox, eventId, sandboxId),
    createCreateOrUpdateFilesTool(log, getSandbox, eventId, sandboxId),
    createReadFilesTool(log, getSandbox, eventId, sandboxId),
    createRunCodeTool(log, getSandbox, eventId, sandboxId),
    createProcessArtifactTool(log, getSandbox, eventId, sandboxId),
  ]
}
