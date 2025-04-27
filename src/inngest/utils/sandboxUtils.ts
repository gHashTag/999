import { Sandbox } from "e2b"

// Function type definition for retrieving a sandbox
export type GetSandboxFunc = (sandboxId: string) => Promise<Sandbox | null>

/**
 * Connects to an existing E2B sandbox or returns null if connection fails.
 * Includes a timeout setting.
 * @param sandboxId The ID of the sandbox to connect to.
 * @returns A Promise resolving to the Sandbox instance or null on error.
 */
export async function getSandbox(sandboxId: string): Promise<Sandbox | null> {
  try {
    const sandbox = await Sandbox.connect(sandboxId)
    // Set a timeout for operations within the sandbox
    await sandbox.setTimeout(5 * 60_000) // 5 minutes
    return sandbox
  } catch (error) {
    // Log the error for debugging purposes
    console.error(`Error connecting to sandbox ${sandboxId}:`, error)
    // Return null to indicate failure, allowing the caller to handle it
    return null
  }
}
