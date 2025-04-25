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
//# sourceMappingURL=events.d.ts.map