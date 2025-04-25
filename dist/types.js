import { z } from "zod";
// Define the main event payload schema
export const codingAgentEventSchema = z.object({
    input: z.string(),
});
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
]);
// Base schema for agent roles
export const AgentRole = z.enum(["TESTER", "CODER", "CRITIC"]);
// Removed duplicate zod schema definition
// export const TddNetworkState = z.object({
//   // ... rest of the schema ...
// });
//# sourceMappingURL=types.js.map