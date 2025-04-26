import { z } from "zod"

// Schemas for Tool Parameters

export const terminalParamsSchema = z.object({ command: z.string() })

export const createOrUpdateFilesParamsSchema = z.object({
  files: z.array(z.object({ path: z.string(), content: z.string() })),
})

export const readFilesParamsSchema = z.object({ files: z.array(z.string()) })

export const runCodeParamsSchema = z.object({ code: z.string() })

export const processArtifactParamsSchema = z.object({
  artifactPath: z.string().describe("Local path to the .tar.gz artifact file"),
  fileToRead: z
    .string()
    .describe("Path to the file to read inside the archive (e.g., 'test.js')"),
})

// Schema for askHumanForInput is likely defined in its own tool file
// export const askHumanInputParamsSchema = z.object({ query: z.string() });
