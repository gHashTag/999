// import { createNetwork, Agent, type NetworkRun } from "@inngest/agent-kit" // Unused
// import { deepseek } from "@inngest/ai/models" // Unused
// Import Zod for schema definition and the NetworkStatus enum
import { z } from "zod"

// Define the Network Statuses
export const NetworkStatus = z.enum([
  "IDLE", // Default state, maybe unused
  "NEEDS_REQUIREMENTS_CRITIQUE", // <<<--- НОВЫЙ СТАТУС: Критик проверяет требования
  "NEEDS_TEST", // Tester needs to write tests/command (после одобрения требований)
  "NEEDS_TEST_REVISION", // Tester needs to revise tests/command based on critique
  // "NEEDS_CODE", // No longer directly needed, command execution handles this
  // "NEEDS_CODE_REVISION", // Revision handled by re-running test generation
  "NEEDS_TEST_CRITIQUE", // Critic needs to review the generated test command/plan
  "NEEDS_COMMAND_EXECUTION", // Handler needs to execute the generated command
  "NEEDS_COMMAND_VERIFICATION", // Critic needs to verify the result of the command
  "NEEDS_IMPLEMENTATION_CRITIQUE", // Critic needs to review the implementation
  "NEEDS_IMPLEMENTATION_REVISION", // Tester needs to generate a *new* command to revise implementation
  "NEEDS_TYPE_CHECK", // Added state for type checking before running tests
  // "READY_FOR_FINAL_TEST", // We might not have this distinct step now
  // "READY_FOR_COMPLETION", // Critic signals completion
  "COMPLETED", // Final success state
  "FAILED", // Final error state
  "NEEDS_HUMAN_INPUT", // Agent needs input from the user
])
export type NetworkStatus = z.infer<typeof NetworkStatus>

// Type for the state object managed by the Agent Network
/* // Remove duplicate interface definition
export interface TddNetworkState {
  task: string
  status: z.infer<typeof NetworkStatus>
  test_requirements?: string
  test_code?: string
  implementation_code?: string
  implementation_critique?: string
  sandboxId?: string | null
  first_failing_test?: string | null
  last_command_output?: string | null
  last_error?: string | null
}
*/

// Remove the isE2eTest field from the Zod schema as well
export const tddNetworkStateSchema = z.object({
  task: z.string(),
  status: NetworkStatus,
  sandboxId: z.string().optional(),
  test_requirements: z.string().optional(),
  command_to_execute: z.string().optional(),
  test_code: z.string().optional(),
  implementation_code: z.string().optional(),
  requirements_critique: z.string().optional(),
  test_critique: z.string().optional(),
  implementation_critique: z.string().optional(),
  last_command_output: z.string().optional(),
  first_failing_test: z.string().optional(),
  // isE2eTest: z.boolean().optional(), // REMOVE this flag
})

// Export the inferred type
export type TddNetworkState = z.infer<typeof tddNetworkStateSchema>
