import { Tool } from "@inngest/agent-kit";
type LoggerFunc = (level: "info" | "warn" | "error", stepName: string, message: string, data?: object) => void;
type AnyTool = Tool<any>;
interface AgentDependencies {
    allTools: AnyTool[];
    log: LoggerFunc;
    eventId: string;
    sandboxId: string | null;
    apiKey: string;
    modelName: string;
}
export declare function createTesterAgent({ allTools, log, eventId, sandboxId, apiKey, modelName, }: Omit<AgentDependencies, "getSandbox">): import("@inngest/agent-kit").Agent<import("@inngest/agent-kit").StateData>;
export declare function createCodingAgent({ allTools, log, eventId, sandboxId, apiKey, modelName, }: Omit<AgentDependencies, "getSandbox">): import("@inngest/agent-kit").Agent<import("@inngest/agent-kit").StateData>;
export declare function createCriticAgent({ allTools, log, eventId, sandboxId, apiKey, modelName, }: Omit<AgentDependencies, "getSandbox">): import("@inngest/agent-kit").Agent<import("@inngest/agent-kit").StateData>;
export {};
//# sourceMappingURL=agentDefinitions.d.ts.map