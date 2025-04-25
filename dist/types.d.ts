import { z } from "zod";
import { EventPayload } from "inngest";
import type { Tool } from "@inngest/agent-kit";
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
export declare const AgentRole: z.ZodEnum<["TESTER", "CODER", "CRITIC"]>;
export type AgentRole = z.infer<typeof AgentRole>;
export type LoggerFunc = (level: "info" | "warn" | "error", stepName: string, message: string, data?: object) => void;
export type AnyTool = Tool<any>;
export interface AgentDependencies {
    allTools: AnyTool[];
    log: LoggerFunc;
    apiKey: string;
    modelName: string;
}
export interface CritiqueData {
    critique?: string;
    needsRevision?: boolean;
    isApproved?: boolean;
    error?: string;
}
//# sourceMappingURL=types.d.ts.map