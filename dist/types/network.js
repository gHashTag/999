import { z } from "zod";
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
//# sourceMappingURL=network.js.map