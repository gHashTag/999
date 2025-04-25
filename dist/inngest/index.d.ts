export * from "./logic/utils";
import "dotenv/config";
import { Inngest, type Context } from "inngest";
import { CodingAgentEvent } from "@/types/events";
export declare const inngest: Inngest<{
    id: string;
}>;
declare function codingAgentHandler({ event, step, }: {
    event: CodingAgentEvent;
    step: Context["step"];
}): Promise<{
    error: string;
    finalState?: undefined;
} | {
    finalState: any;
    error?: undefined;
}>;
export declare const codingAgentFunction: import("inngest").InngestFunction<Omit<import("inngest").InngestFunction.Options<Inngest<{
    id: string;
}>, import("inngest").InngestMiddleware.Stack, [{
    event: string;
}], import("inngest").Handler<Inngest<{
    id: string;
}>, string, {
    event: import("inngest").FailureEventPayload<import("inngest").EventPayload<any>>;
    logger: import("inngest/middleware/logger").Logger;
    error: Error;
}>>, "triggers">, typeof codingAgentHandler, import("inngest").Handler<Inngest<{
    id: string;
}>, string, {
    event: import("inngest").FailureEventPayload<import("inngest").EventPayload<any>>;
    logger: import("inngest/middleware/logger").Logger;
    error: Error;
}>, Inngest<{
    id: string;
}>, import("inngest").InngestMiddleware.Stack, [{
    event: string;
}]>;
//# sourceMappingURL=index.d.ts.map