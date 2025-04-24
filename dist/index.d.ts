import "dotenv/config";
import { Inngest } from "inngest";
declare const inngest: Inngest<{
    id: string;
}>;
declare function codingAgentHandler({ event, step }: any): Promise<any>;
declare const agentFunction: import("inngest").InngestFunction<Omit<import("inngest").InngestFunction.Options<Inngest<{
    id: string;
}>, import("inngest").InngestMiddleware.Stack, [{
    event: string;
}], import("inngest").Handler<Inngest<{
    id: string;
}>, string, {
    logger: import("inngest/middleware/logger").Logger;
    event: import("inngest").FailureEventPayload<import("inngest").EventPayload<any>>;
    error: Error;
}>>, "triggers">, typeof codingAgentHandler, import("inngest").Handler<Inngest<{
    id: string;
}>, string, {
    logger: import("inngest/middleware/logger").Logger;
    event: import("inngest").FailureEventPayload<import("inngest").EventPayload<any>>;
    error: Error;
}>, Inngest<{
    id: string;
}>, import("inngest").InngestMiddleware.Stack, [{
    event: string;
}]>;
export { inngest, agentFunction, codingAgentHandler };
//# sourceMappingURL=index.d.ts.map