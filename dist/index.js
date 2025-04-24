/* eslint-disable */
import "dotenv/config";
import * as fs from "node:fs";
import { z } from "zod";
import { Inngest } from "inngest";
// Uncomment agent-kit imports
import { createAgent, createNetwork, createTool } from "@inngest/agent-kit";
import { deepseek } from "@inngest/ai/models";
import { getSandbox, lastAssistantTextMessageContent, } from "./inngest/utils.js";
import { Sandbox } from "@e2b/code-interpreter";
const inngest = new Inngest({ id: "agentkit-coding-agent" });
// Remove Dummy implementations
/*
const createTool = (config: any) => ({ ...config, isTool: true });
const createAgent = (config: any) => ({ ...config, isAgent: true });
const createNetwork = (config: any) => ({
  ...config,
  isNetwork: true,
  run: async (input: any) => {
    console.warn("WARN: createNetwork is mocked, actual network run skipped.");
    const summary =
      typeof input === "string" && input.includes("<task_summary>")
        ? input
        : null;
    return { state: { kv: new Map().set("task_summary", summary) } };
  },
});
*/
// Define the handler function separately
async function codingAgentHandler({ event, step }) {
    const sandboxId = await step.run("get-sandbox-id", async () => {
        const sandbox = await Sandbox.create(); // Ensure Sandbox is imported
        return sandbox.sandboxId;
    });
    // Define tools within the handler or pass them if defined outside
    const toolTerminal = createTool({
        name: "terminal",
        description: "Use the terminal to run commands",
        parameters: z.object({
            command: z.string(),
        }),
        handler: async ({ command }, { step }) => {
            return await step?.run("terminal", async () => {
                const buffers = { stdout: "", stderr: "" };
                try {
                    const sandbox = await getSandbox(sandboxId);
                    if (!sandbox)
                        throw new Error("Sandbox not found");
                    const result = await sandbox.commands.run(command, {
                        onStdout: (data) => {
                            buffers.stdout += data;
                        },
                        onStderr: (data) => {
                            buffers.stderr += data;
                        },
                    });
                    return result.stdout;
                }
                catch (e) {
                    console.error(`Command failed: ${e} \nstdout: ${buffers.stdout}\nstderr: ${buffers.stderr}`);
                    return `Command failed: ${e} \nstdout: ${buffers.stdout}\nstderr: ${buffers.stderr}`;
                }
            });
        },
    });
    const toolCreateOrUpdateFiles = createTool({
        name: "createOrUpdateFiles",
        description: "Create or update files in the sandbox",
        parameters: z.object({
            files: z.array(z.object({
                path: z.string(),
                content: z.string(),
            })),
        }),
        handler: async ({ files }, { step }) => {
            return await step?.run("createOrUpdateFiles", async () => {
                try {
                    const sandbox = await getSandbox(sandboxId);
                    if (!sandbox)
                        throw new Error("Sandbox not found");
                    for (const file of files) {
                        await sandbox.files.write(file.path, file.content);
                    }
                    return `Files created or updated: ${files
                        .map((f) => f.path)
                        .join(", ")}`;
                }
                catch (e) {
                    return "Error: " + e;
                }
            });
        },
    });
    const toolReadFiles = createTool({
        name: "readFiles",
        description: "Read files from the sandbox",
        parameters: z.object({
            files: z.array(z.string()),
        }),
        handler: async ({ files }, { step }) => {
            return await step?.run("readFiles", async () => {
                try {
                    const sandbox = await getSandbox(sandboxId);
                    if (!sandbox)
                        throw new Error("Sandbox not found");
                    const contents = [];
                    for (const file of files) {
                        const content = await sandbox.files.read(file);
                        contents.push({ path: file, content });
                    }
                    return JSON.stringify(contents);
                }
                catch (e) {
                    return "Error: " + e;
                }
            });
        },
    });
    const toolRunCode = createTool({
        name: "runCode",
        description: "Run the code in the sandbox",
        parameters: z.object({
            code: z.string(),
        }),
        handler: async ({ code }, { step }) => {
            return await step?.run("runCode", async () => {
                try {
                    const sandbox = await getSandbox(sandboxId);
                    if (!sandbox)
                        throw new Error("Sandbox not found");
                    const result = await sandbox.runCode(code);
                    return result.logs.stdout.join("\n");
                }
                catch (e) {
                    return "Error: " + e;
                }
            });
        },
    });
    const agent = createAgent({
        name: "Coding Agent",
        description: "An expert coding agent",
        system: `You are a coding agent help the user to achieve the described task.

    When running commands, keep in mind that the terminal is non-interactive, remind to use the '-y' flag when running commands.

    Once the task completed, you should return the following information:
    <task_summary>
    </task_summary>

    Think step-by-step before you start the task.
    `,
        model: deepseek({
            apiKey: process.env.DEEPSEEK_API_KEY,
            model: (process.env.DEEPSEEK_MODEL || "deepseek-coder"),
        }),
        tools: [toolTerminal, toolCreateOrUpdateFiles, toolReadFiles, toolRunCode],
        lifecycle: {
            onResponse: async ({ result, network }) => {
                const lastAssistantMessageText = lastAssistantTextMessageContent(result);
                if (lastAssistantMessageText?.includes("<task_summary>")) {
                    const net = network || { state: { kv: new Map() } };
                    net.state.kv.set("task_summary", lastAssistantMessageText);
                }
                return result;
            },
        },
    });
    const network = createNetwork({
        name: "coding-agent-network",
        agents: [agent],
        maxIter: 15,
        defaultRouter: async ({ network }) => {
            const net = network || { state: { kv: new Map() } };
            if (net.state.kv.has("task_summary"))
                return;
            return agent;
        },
    });
    await network.run(event.data.input);
    await step.run("download-artifact", async () => {
        console.log("------------------------------------");
        console.log("Downloading artifact...");
        const sandbox = await getSandbox(sandboxId);
        if (!sandbox)
            throw new Error("Sandbox not found");
        await sandbox.commands.run("touch artifact.tar.gz && tar --exclude=artifact.tar.gz --exclude=node_modules --exclude=.npm --exclude=.env --exclude=.bashrc --exclude=.profile  --exclude=.bash_logout --exclude=.env* -zcvf artifact.tar.gz .");
        const artifact = await sandbox.files.read("artifact.tar.gz", {
            format: "blob",
        });
        const localFileName = `artifact-${new Date().toISOString()}.tar.gz`;
        const arrayBuffer = await artifact.arrayBuffer();
        fs.writeFileSync(localFileName, Buffer.from(arrayBuffer)); // Ensure correct fs usage
        console.log(`Artifact downloaded in ${localFileName}`);
        console.log(`Extract artifact by running: \`mkdir artifact && tar -xvzf ${localFileName} -C artifact\``);
        console.log("------------------------------------");
        await sandbox.kill();
    });
    const finalNet = network || { state: { kv: new Map() } };
    return finalNet.state.kv.get("task_summary");
}
// Create the Inngest function using the handler
const agentFunction = inngest.createFunction({
    id: "Coding Agent",
    retries: 0,
}, { event: "coding-agent/run" }, codingAgentHandler // Pass the handler function here
);
// Export the handler for testing, and the Inngest function object
export { inngest, agentFunction, codingAgentHandler };
//# sourceMappingURL=index.js.map