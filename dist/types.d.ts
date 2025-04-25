import { z } from "zod";
import { EventPayload } from "inngest";
export declare const codingAgentEventSchema: z.ZodObject<{
    input: z.ZodString;
}, "strip", z.ZodTypeAny, {
    input: string;
}, {
    input: string;
}>;
export type CodingAgentEvent = EventPayload<{
    name: "coding-agent/run";
    data: z.infer<typeof codingAgentEventSchema>;
}>;
export declare const NetworkStatus: z.ZodEnum<["NEEDS_TEST", "NEEDS_TEST_CRITIQUE", "NEEDS_TEST_REVISION", "NEEDS_CODE", "NEEDS_CODE_CRITIQUE", "NEEDS_CODE_REVISION", "READY_FOR_FINAL_TEST", "COMPLETED_TESTS_PASSED", "COMPLETED_TESTS_FAILED", "COMPLETED"]>;
export type NetworkStatus = z.infer<typeof NetworkStatus>;
export interface TddNetworkState {
    task: string;
    status: NetworkStatus;
    sandboxId: string | null;
    test_artifact_path?: string;
    code_artifact_path?: string;
    test_critique?: string;
    code_critique?: string;
    error?: string;
    test_code?: string;
    implementation_code?: string;
    current_code?: string;
    test_run_output?: string;
}
//# sourceMappingURL=types.d.ts.map