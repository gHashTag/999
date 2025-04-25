import { z } from "zod";
import type { LoggerFunc } from "../types/agents.js";
import type { GetSandboxFunc } from "../inngest/index.js";
export declare const terminalParamsSchema: z.ZodObject<{
    command: z.ZodString;
}, "strip", z.ZodTypeAny, {
    command: string;
}, {
    command: string;
}>;
export declare const createOrUpdateFilesParamsSchema: z.ZodObject<{
    files: z.ZodArray<z.ZodObject<{
        path: z.ZodString;
        content: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        path: string;
        content: string;
    }, {
        path: string;
        content: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    files: {
        path: string;
        content: string;
    }[];
}, {
    files: {
        path: string;
        content: string;
    }[];
}>;
export declare const readFilesParamsSchema: z.ZodObject<{
    files: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    files: string[];
}, {
    files: string[];
}>;
export declare const runCodeParamsSchema: z.ZodObject<{
    code: z.ZodString;
}, "strip", z.ZodTypeAny, {
    code: string;
}, {
    code: string;
}>;
export declare const processArtifactParamsSchema: z.ZodObject<{
    artifactPath: z.ZodString;
    fileToRead: z.ZodString;
}, "strip", z.ZodTypeAny, {
    artifactPath: string;
    fileToRead: string;
}, {
    artifactPath: string;
    fileToRead: string;
}>;
export declare function createTerminalTool(log: LoggerFunc, getSandbox: GetSandboxFunc, eventId: string, sandboxId: string | null): import("@inngest/agent-kit").Tool<z.ZodObject<{
    command: z.ZodString;
}, "strip", z.ZodTypeAny, {
    command: string;
}, {
    command: string;
}>>;
export declare function createCreateOrUpdateFilesTool(log: LoggerFunc, getSandbox: GetSandboxFunc, eventId: string, sandboxId: string | null): import("@inngest/agent-kit").Tool<z.ZodObject<{
    files: z.ZodArray<z.ZodObject<{
        path: z.ZodString;
        content: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        path: string;
        content: string;
    }, {
        path: string;
        content: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    files: {
        path: string;
        content: string;
    }[];
}, {
    files: {
        path: string;
        content: string;
    }[];
}>>;
export declare function createReadFilesTool(log: LoggerFunc, getSandbox: GetSandboxFunc, eventId: string, sandboxId: string | null): import("@inngest/agent-kit").Tool<z.ZodObject<{
    files: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    files: string[];
}, {
    files: string[];
}>>;
export declare function createRunCodeTool(log: LoggerFunc, getSandbox: GetSandboxFunc, eventId: string, sandboxId: string | null): import("@inngest/agent-kit").Tool<z.ZodObject<{
    code: z.ZodString;
}, "strip", z.ZodTypeAny, {
    code: string;
}, {
    code: string;
}>>;
export declare function createProcessArtifactTool(log: LoggerFunc, getSandbox: GetSandboxFunc, eventId: string, sandboxId: string | null): import("@inngest/agent-kit").Tool<z.ZodObject<{
    artifactPath: z.ZodString;
    fileToRead: z.ZodString;
}, "strip", z.ZodTypeAny, {
    artifactPath: string;
    fileToRead: string;
}, {
    artifactPath: string;
    fileToRead: string;
}>>;
export declare function getAllTools(log: LoggerFunc, getSandbox: GetSandboxFunc, eventId: string, sandboxId: string | null): (import("@inngest/agent-kit").Tool<z.ZodObject<{
    command: z.ZodString;
}, "strip", z.ZodTypeAny, {
    command: string;
}, {
    command: string;
}>> | import("@inngest/agent-kit").Tool<z.ZodObject<{
    files: z.ZodArray<z.ZodObject<{
        path: z.ZodString;
        content: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        path: string;
        content: string;
    }, {
        path: string;
        content: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    files: {
        path: string;
        content: string;
    }[];
}, {
    files: {
        path: string;
        content: string;
    }[];
}>> | import("@inngest/agent-kit").Tool<z.ZodObject<{
    files: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    files: string[];
}, {
    files: string[];
}>> | import("@inngest/agent-kit").Tool<z.ZodObject<{
    code: z.ZodString;
}, "strip", z.ZodTypeAny, {
    code: string;
}, {
    code: string;
}>> | import("@inngest/agent-kit").Tool<z.ZodObject<{
    artifactPath: z.ZodString;
    fileToRead: z.ZodString;
}, "strip", z.ZodTypeAny, {
    artifactPath: string;
    fileToRead: string;
}, {
    artifactPath: string;
    fileToRead: string;
}>> | import("@inngest/agent-kit").Tool<z.ZodObject<{
    question: z.ZodString;
    context: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    question: string;
    context?: string | undefined;
}, {
    question: string;
    context?: string | undefined;
}>>)[];
export declare const askHumanForInputParamsSchema: z.ZodObject<{
    question: z.ZodString;
    context: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    question: string;
    context?: string | undefined;
}, {
    question: string;
    context?: string | undefined;
}>;
export declare function createAskHumanForInputTool(log: LoggerFunc, eventId: string): import("@inngest/agent-kit").Tool<z.ZodObject<{
    question: z.ZodString;
    context: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    question: string;
    context?: string | undefined;
}, {
    question: string;
    context?: string | undefined;
}>>;
//# sourceMappingURL=toolDefinitions.d.ts.map