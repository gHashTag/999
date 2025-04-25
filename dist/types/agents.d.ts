import type { Tool } from "@inngest/agent-kit";
import { z } from "zod";
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
//# sourceMappingURL=agents.d.ts.map