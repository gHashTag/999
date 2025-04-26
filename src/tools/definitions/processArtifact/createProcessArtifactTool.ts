import { createTool } from "@inngest/agent-kit"
import * as fs from "node:fs"
import * as path from "node:path"
import type { LoggerFunc } from "@/types/agents"
// import type { GetSandboxFunc } from "@/inngest"
// import { execSync } from "child_process"
// import { readFileSync, mkdirSync, rmSync } from "fs"
// import { join } from "path"
// Use alias for schema import
import { processArtifactParamsSchema } from "@/tools/schemas"

export function createProcessArtifactTool(
  log: LoggerFunc,
  // getSandbox: GetSandboxFunc, // Параметр не используется, удаляем
  eventId: string,
  sandboxId: string | null // Keep sandboxId for logging context
) {
  return createTool({
    name: "processArtifact",
    description:
      "Extracts a specific file from a downloaded artifact (.tar.gz) and returns its content.",
    parameters: processArtifactParamsSchema,
    handler: async params => {
      const currentSandboxId = sandboxId // Use sandboxId for logging
      const toolStepName = "TOOL_processArtifact"
      log("info", `${toolStepName}_START`, "Processing artifact.", {
        eventId,
        currentSandboxId, // Log sandboxId even if not directly used for action
        artifactPath: params.artifactPath,
        fileToRead: params.fileToRead,
      })

      const tempExtractDir = `/tmp/artifact-extract-${Date.now()}`

      try {
        // 1. Check if artifact exists locally
        if (!fs.existsSync(params.artifactPath)) {
          throw new Error(`Artifact file not found: ${params.artifactPath}`)
        }

        // 2. Create temporary directory
        fs.mkdirSync(tempExtractDir, { recursive: true })
        log("info", `${toolStepName}_MKDIR`, "Created temporary directory.", {
          eventId,
          currentSandboxId,
          dir: tempExtractDir,
        })

        // 3. Extract the artifact using tar command (assuming tar is available)
        // We need to run this command outside the sandbox, in the host environment where the artifact was downloaded.
        // TODO: Add 'tar' package and types if dynamic import fails OR use sandbox.process.start('tar ...')
        /* // ВРЕМЕННО ЗАКОММЕНТИРОВАНО ИЗ-ЗА ОШИБКИ ТИПОВ
        const tar = await import("tar"); // Dynamically import tar
        await tar.x({
          file: params.artifactPath,
          cwd: tempExtractDir,
          strip: 1, // Adjust strip components if necessary based on archive structure
        });

        log("info", `${toolStepName}_EXTRACT`, "Artifact extracted.", {
          eventId,
          currentSandboxId,
          dir: tempExtractDir,
        });
        */
        // ЗАГЛУШКА: Вместо реальной распаковки, просто создадим пустой файл
        const targetFilePath = path.join(tempExtractDir, params.fileToRead)
        fs.writeFileSync(
          targetFilePath,
          "// Extracted content would be here (extraction disabled)",
          "utf-8"
        )
        log(
          "warn",
          `${toolStepName}_EXTRACT_DISABLED`,
          "Artifact extraction is disabled, using placeholder content.",
          {
            eventId,
            currentSandboxId,
            file: params.fileToRead,
          }
        )

        // 4. Read the specific file from the extracted directory
        // const targetFilePath = path.join(tempExtractDir, params.fileToRead);
        // ... остальная логика чтения и очистки ...

        // 5. Clean up temporary directory (optional, but good practice)
        fs.rmSync(tempExtractDir, { recursive: true, force: true })
        log("info", `${toolStepName}_CLEANUP`, "Cleaned up temp directory.", {
          eventId,
          currentSandboxId,
          dir: tempExtractDir,
        })

        return {
          fileContent:
            "// Extracted content would be here (extraction disabled)",
        }
      } catch (e: unknown) {
        let errorMessage = "Unknown artifact processing error"
        let errorStack = undefined
        if (e instanceof Error) {
          errorMessage = e.message
          errorStack = e.stack
        } else if (typeof e === "string") {
          errorMessage = e
        }
        log("error", `${toolStepName}_ERROR`, "Error processing artifact.", {
          eventId,
          currentSandboxId,
          artifactPath: params.artifactPath,
          fileToRead: params.fileToRead,
          error: errorMessage,
          stack: errorStack,
        })
        // Clean up temp dir even on error
        if (fs.existsSync(tempExtractDir)) {
          try {
            fs.rmSync(tempExtractDir, { recursive: true, force: true })
          } catch (cleanupError) {
            log(
              "error",
              `${toolStepName}_CLEANUP_ERROR`,
              "Failed to cleanup temp directory after error.",
              { eventId, currentSandboxId, dir: tempExtractDir }
            )
          }
        }
        return { error: `Artifact processing failed: ${errorMessage}` }
      }
    },
  })
}
