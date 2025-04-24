import { z } from "zod";
export declare function createCodingTools(sandboxId: string): {
    toolTerminal: import("@inngest/agent-kit").Tool<z.ZodObject<{
        command: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        command: string;
    }, {
        command: string;
    }>>;
    toolCreateOrUpdateFiles: import("@inngest/agent-kit").Tool<z.ZodObject<{
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
    toolReadFiles: import("@inngest/agent-kit").Tool<z.ZodObject<{
        files: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        files: string[];
    }, {
        files: string[];
    }>>;
    toolRunCode: import("@inngest/agent-kit").Tool<z.ZodObject<{
        code: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        code: string;
    }, {
        code: string;
    }>>;
};
//# sourceMappingURL=index.d.ts.map