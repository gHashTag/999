import { z } from "zod"
import { EventPayload } from "inngest"

// Define the main event payload schema
export const codingAgentEventSchema = z.object({
  input: z.string(),
})

export type CodingAgentEvent = EventPayload<{
  name: "coding-agent/run"
  data: z.infer<typeof codingAgentEventSchema>
}>

// Define the Network States for TDD flow with Critique Loop
export const NetworkStatus = z.enum([
  "NEEDS_TEST", // Initial state: Tester needs to write tests
  "NEEDS_TEST_CRITIQUE", // Critic needs to review the tests
  "NEEDS_TEST_REVISION", // Tester needs to revise tests based on critique
  "NEEDS_CODE", // Tests approved: Coder needs to write implementation
  "NEEDS_CODE_CRITIQUE", // Critic needs to review the code
  "NEEDS_CODE_REVISION", // Coder needs to revise code based on critique
  "READY_FOR_FINAL_TEST", // Code approved: Run tests before completing
  "COMPLETED_TESTS_PASSED", // Final tests passed
  "COMPLETED_TESTS_FAILED", // Final tests failed
  "COMPLETED", // Generic completion (maybe use PASSED/FAILED instead)
])
export type NetworkStatus = z.infer<typeof NetworkStatus>

// Define a type for the network state
export interface TddNetworkState {
  task: string
  status: NetworkStatus // Use the enum type
  sandboxId: string | null
  test_artifact_path?: string // Keep for now, maybe remove later
  code_artifact_path?: string // Keep for now, maybe remove later
  test_critique?: string
  code_critique?: string
  error?: string
  // Fields to store code content directly
  test_code?: string
  implementation_code?: string
  // Possibly unused fields from previous iterations
  current_code?: string // Consider removing if implementation_code replaces it
  test_run_output?: string // To store output/error from final test run
}
