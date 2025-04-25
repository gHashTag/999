import { z } from "zod";
export declare const NetworkStatus: z.ZodEnum<["IDLE", "NEEDS_TEST", "NEEDS_TEST_REVISION", "NEEDS_CODE", "NEEDS_CODE_REVISION", "NEEDS_TEST_CRITIQUE", "NEEDS_CODE_CRITIQUE", "READY_FOR_FINAL_TEST", "COMPLETED_TESTS_PASSED", "COMPLETED_TESTS_FAILED", "COMPLETED", "NEEDS_HUMAN_INPUT"]>;
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
//# sourceMappingURL=network.d.ts.map