import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

/**
 * Reads the instructions for a given agent from the .cursor/rules directory.
 * @param agentName - The name of the agent (e.g., 'TeamLead', 'Tester'). Used to find AGENT_{agentName}.mdc.
 * @returns The content of the instructions file as a string.
 * @throws Error if the file cannot be read or is empty.
 */
export function readAgentInstructions(agentName: string): string {
  const currentFilePath = fileURLToPath(import.meta.url)
  const currentDir = path.dirname(currentFilePath)
  // Navigate up from src/utils/logic to the project root
  const projectRoot = path.resolve(currentDir, "../../../")
  console.log("[readAgentInstructions] Calculated projectRoot:", projectRoot)

  const fileName = `AGENT_${agentName}.mdc`
  const instructionsPath = path.resolve(projectRoot, ".cursor/rules", fileName)
  console.log("[readAgentInstructions] Resolved path:", instructionsPath)

  let instructions: string
  try {
    instructions = fs.readFileSync(instructionsPath, "utf-8")
  } catch (error) {
    console.error(
      `CRITICAL_ERROR: Could not read ${agentName} instructions from ${instructionsPath}`,
      error
    )
    throw new Error(
      `${agentName} instructions could not be read from ${instructionsPath}`
    )
  }

  if (!instructions || instructions.trim() === "") {
    console.error(
      `CRITICAL_ERROR: ${agentName} instructions read from ${instructionsPath} are empty.`
    )
    throw new Error(
      `${agentName} instructions read from ${instructionsPath} are empty.`
    )
  }

  return instructions
}
