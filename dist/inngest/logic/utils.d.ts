import { Sandbox } from "@e2b/code-interpreter";
export type GetSandboxFunc = (sandboxId: string) => Promise<Sandbox | null>;
export declare function lastAssistantTextMessageContent(result: any): string | undefined;
export declare function getSandbox(sandboxId: string): Promise<Sandbox | null>;
//# sourceMappingURL=utils.d.ts.map