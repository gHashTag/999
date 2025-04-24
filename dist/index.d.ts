import "dotenv/config";
import { z } from "zod";
import { Inngest, EventPayload } from "inngest";
declare const codingAgentEventSchema: z.ZodObject<{
    input: z.ZodString;
}, "strip", z.ZodTypeAny, {
    input: string;
}, {
    input: string;
}>;
type CodingAgentEvent = EventPayload<{
    name: "coding-agent/run";
    data: z.infer<typeof codingAgentEventSchema>;
}>;
declare const inngest: Inngest<{
    id: string;
}>;
declare function codingAgentHandler({ event, step, }: {
    event: CodingAgentEvent;
    step: any;
}): Promise<{
    event: CodingAgentEvent;
    finalState: any;
}>;
declare const codingAgentFunction: import("inngest").InngestFunction<Omit<import("inngest").InngestFunction.Options<Inngest<{
    id: string;
}>, import("inngest").InngestMiddleware.Stack, [{
    event: string;
}], import("inngest").Handler<Inngest<{
    id: string;
}>, string, {
    logger: import("inngest/middleware/logger").Logger;
    event: import("inngest").FailureEventPayload<EventPayload<any>>;
    error: Error;
}>>, "triggers">, typeof codingAgentHandler, import("inngest").Handler<Inngest<{
    id: string;
}>, string, {
    logger: import("inngest/middleware/logger").Logger;
    event: import("inngest").FailureEventPayload<EventPayload<any>>;
    error: Error;
}>, Inngest<{
    id: string;
}>, import("inngest").InngestMiddleware.Stack, [{
    event: string;
}]>;
export { inngest, codingAgentFunction as codingAgent };
//# sourceMappingURL=index.d.ts.map