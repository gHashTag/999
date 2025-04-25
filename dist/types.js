import { z } from "zod";
// Define the main event payload schema
export const codingAgentEventSchema = z.object({
    input: z.string(),
});
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
]);
//# sourceMappingURL=types.js.map