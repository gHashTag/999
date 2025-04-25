import { z } from "zod"

// Define the Network States for TDD flow with Critique Loop
export const NetworkStatus = z.enum([
  "IDLE",
  "NEEDS_TEST",
  "NEEDS_TEST_REVISION",
  "NEEDS_CODE",
  "NEEDS_CODE_REVISION",
  "NEEDS_TEST_CRITIQUE",
  "NEEDS_CODE_CRITIQUE",
  "READY_FOR_FINAL_TEST",
  "COMPLETED_TESTS_PASSED",
  "COMPLETED_TESTS_FAILED",
  "COMPLETED", // Generic completed status
  "NEEDS_HUMAN_INPUT", // Added status for HITL
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
