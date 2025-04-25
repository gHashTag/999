import "dotenv/config";
import { Inngest } from "inngest";
import { CodingAgentEvent } from "./types/events.js";
declare const inngest: Inngest<{
    id: string;
}>;
declare function codingAgentHandler({ event, step, }: {
    event: CodingAgentEvent;
    step: any;
}): Promise<{
    finalState: any;
}>;
declare const codingAgentFunction: import("inngest").InngestFunction<Omit<import("inngest").InngestFunction.Options<Inngest<{
    id: string;
}>, import("inngest").InngestMiddleware.Stack, [{
    event: string;
}], import("inngest").Handler<Inngest<{
    id: string;
}>, string, {
    error: Error;
    logger: import("inngest/middleware/logger").Logger;
    event: import("inngest").FailureEventPayload<import("inngest").EventPayload<any>>;
}>>, "triggers">, typeof codingAgentHandler, import("inngest").Handler<Inngest<{
    id: string;
}>, string, {
    error: Error;
    logger: import("inngest/middleware/logger").Logger;
    event: import("inngest").FailureEventPayload<import("inngest").EventPayload<any>>;
}>, Inngest<{
    id: string;
}>, import("inngest").InngestMiddleware.Stack, [{
    event: string;
}]>;
export { inngest, codingAgentFunction as codingAgent };
//# sourceMappingURL=index.d.ts.map