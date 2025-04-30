import { z } from "zod"
import { NetworkStatus } from "@/types/network"

// Schemas for Tool Parameters

export const terminalParamsSchema = z.object({ command: z.string() })

export const createOrUpdateFilesParamsSchema = z.object({
  files: z.array(z.object({ path: z.string(), content: z.string() })),
})

export const readFilesParamsSchema = z.object({
  files: z.array(z.string()).describe("An array of file paths to read."),
})

export const runCodeParamsSchema = z.object({ code: z.string() })

export const processArtifactParamsSchema = z.object({
  artifactPath: z.string().describe("Local path to the .tar.gz artifact file"),
  fileToRead: z
    .string()
    .describe("Path to the file to read inside the archive (e.g., 'test.js')"),
})

// Schema for askHumanForInput is likely defined in its own tool file
// export const askHumanInputParamsSchema = z.object({ query: z.string() });

// Schema for writeFile tool parameters
export const writeFilesParamsSchema = z.object({
  files: z
    .array(
      z.object({
        path: z.string().describe("The path of the file to write."),
        content: z.string().describe("The content to write to the file."),
      })
    )
    .describe("An array of files to write, each with a path and content."),
})

// Schema for runCommand tool parameters
export const runCommandParamsSchema = z.object({
  command: z.string().describe("The terminal command to execute."),
  // Add other potential parameters like working directory, env variables etc.
})

// Schema for updateTaskState tool parameters
// Uses .partial() to allow updating any subset of TddNetworkState fields
// Define a base schema with potentially updatable fields first
const tddStateUpdatableFields = z.object({
  status: NetworkStatus, // Use the enum directly
  task_description: z.string().optional(),
  test_requirements: z.string().optional(),
  test_code: z.string().optional(),
  implementation_code: z.string().optional(),
  critique: z.string().optional(),
  error_message: z.string().optional(),
  command_to_execute: z.string().optional(),
  command_output: z.string().optional(),
  first_failing_test: z.string().optional(),
  // Add other fields from TddNetworkState that should be updatable via this tool
})

// The actual parameter schema expects an 'updates' object
// containing a partial set of the updatable fields.
export const updateTaskStateParamsSchema = z.object({
  updates: tddStateUpdatableFields
    .partial()
    .describe("An object containing the state fields to update."),
})
