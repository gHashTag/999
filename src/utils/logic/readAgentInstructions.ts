import path from "node:path"
import fs from "fs/promises"
import { fileURLToPath } from "node:url"
import { log } from "@/utils/logic/logger"

/**
 * Reads the instructions for a given agent from the .cursor/rules directory.
 * @param agentName - The name of the agent (e.g., 'TeamLead', 'Tester'). Used to find AGENT_{agentName}.mdc.
 * @returns The content of the instructions file as a string.
 * @throws Error if the file cannot be read or is empty.
 */
export async function readAgentInstructions(
  agentName: string
): Promise<string> {
  let instructionsPath: string | undefined
  try {
    const currentFilePath = fileURLToPath(import.meta.url)
    const currentDir = path.dirname(currentFilePath)
    // Navigate up from src/utils/logic to the project root
    const projectRoot = path.resolve(currentDir, "../../../")
    log(
      "info",
      "READ_INSTRUCTIONS_PATH",
      `Calculated project root: ${projectRoot}`
    )

    const fileName = `AGENT_${agentName}.mdc`
    instructionsPath = path.join(projectRoot, ".cursor", "rules", fileName)
    log(
      "info",
      "READ_INSTRUCTIONS_PATH",
      `Resolved instructions path: ${instructionsPath}`
    )

    const content = await fs.readFile(instructionsPath, "utf-8")
    return content
  } catch (error) {
    log(
      "error",
      "READ_INSTRUCTIONS_ERROR",
      `Failed to read instructions for ${agentName}${instructionsPath ? ` from ${instructionsPath}` : ""}`,
      { error: error instanceof Error ? error.message : String(error) }
    )
    // Ensure instructionsPath is defined before throwing error using it
    const errorPath = instructionsPath ?? `AGENT_${agentName}.mdc`
    throw new Error(
      `${agentName} instructions could not be read from ${errorPath}`
    )
  }
}
