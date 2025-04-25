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
export interface TddNetworkState {
    task: string;
    status: string;
    sandboxId: string | null;
    test_artifact_path?: string;
    code_artifact_path?: string;
    test_critique?: string;
    code_critique?: string;
    error?: string;
    test_code?: string;
    current_code?: string;
}
//# sourceMappingURL=types.d.ts.map