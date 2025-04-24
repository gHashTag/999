/* eslint-disable */
import "dotenv/config"

import * as fs from "node:fs"
import { z } from "zod"
import { Inngest, EventPayload } from "inngest"

// AgentKit Core (No longer needed here)
// import { createAgent, createNetwork, createTool } from "@inngest/agent-kit"

// Models (No longer needed here)
// import { deepseek } from "@inngest/ai/models"

import { getSandbox } from "./inngest/utils.js"
import { Sandbox } from "@e2b/code-interpreter"
import { createCodingTools } from "./tools/index.js" // Import tools factory
import { createCodingAgent } from "./agents/codingAgent.js" // Import coding agent factory
import { createRefactoringAgent } from "./agents/refactoringAgent.js" // Import the new agent
import { createDevOpsNetwork } from "./network.js" // Import network factory

const inngest = new Inngest({ id: "agentkit-coding-agent" })

// Define the main event payload schema
const codingAgentEventSchema = z.object({
  input: z.string(),
})

type CodingAgentEvent = EventPayload<{
  name: "coding-agent/run"
  data: z.infer<typeof codingAgentEventSchema>
}>

// Initialize Inngest Client
// const inngest = new Inngest({ id: "agentkit-coding-agent" })

// --- Main Handler --- //
async function codingAgentHandler({
  event,
  step,
}: {
  event: CodingAgentEvent
  step: any
}) {
  const sandboxId = await step.run("get-sandbox-id", async () => {
    const sandbox = await Sandbox.create()
    return sandbox.sandboxId
  })

  // Instantiate tools with the sandboxId for this run
  const tools = createCodingTools(sandboxId)

  // Instantiate agents
  const codingAgent = createCodingAgent(tools)
  const refactoringAgent = createRefactoringAgent(tools) // Instantiate the new agent

  // Instantiate the network with *both* agents
  const network = createDevOpsNetwork(codingAgent, refactoringAgent)

  // Validate event data
  if (!event.data) {
    throw new Error("Event data is missing!")
  }

  // Run the network
  // @ts-ignore - Temporarily ignore type error for event.data.input access
  await network.run(event.data.input)

  // Download artifact
  await step.run("download-artifact", async () => {
    console.log("------------------------------------")
    console.log("Downloading artifact...")
    const sandbox = await getSandbox(sandboxId)
    if (!sandbox) throw new Error("Sandbox not found")
    // Ensure the artifact name is consistent
    const sandboxArtifactName = "artifact.tar.gz"
    // Create the archive inside the sandbox
    await sandbox.commands.run(
      `tar --exclude=${sandboxArtifactName} --exclude=node_modules --exclude=.npm --exclude=.env --exclude=.bashrc --exclude=.profile  --exclude=.bash_logout --exclude=.env* -zcvf ${sandboxArtifactName} .`
    )
    // Read the artifact blob
    const artifact = await sandbox.files.read(sandboxArtifactName, {
      format: "blob",
    })
    // Define local path and filename
    const localDirectory = "artifacts" // Save inside artifacts/ directory
    const localFileName = `${localDirectory}/artifact-${new Date().toISOString()}.tar.gz`
    // Ensure the local directory exists (it should, we created it)
    // fs.mkdirSync(localDirectory, { recursive: true }); // Keep commented unless issues arise
    // Write the artifact file locally
    const arrayBuffer = await artifact.arrayBuffer()
    fs.writeFileSync(localFileName, Buffer.from(arrayBuffer))
    console.log(`Artifact downloaded in ${localFileName}`)
    // Update extraction command hint
    console.log(
      `Extract artifact by running: \`mkdir -p ${localFileName}-extracted && tar -xvzf ${localFileName} -C ${localFileName}-extracted\``
    )
    console.log("------------------------------------")
    await sandbox.kill()
  })

  const finalNet = network
  return finalNet?.state?.kv?.get("task_summary")
}

// --- Inngest Function Definition --- //
const agentFunction = inngest.createFunction(
  {
    id: "Coding Agent", // This ID might need renaming if it represents the network now
    retries: 0,
  },
  { event: "coding-agent/run" },
  codingAgentHandler
)

// --- Export for Server --- //
// No longer exporting individual agents/handlers directly
// Export the Inngest client and the function(s) for the server
export { inngest, agentFunction }

// --- HTTP Server (Entry Point) --- //
import { serve } from "inngest/express" // Import the serve adapter
import express from "express"

const app = express()
app.use(express.json()) // Middleware to parse JSON bodies

// Serve the Inngest function(s)
app.use("/api/inngest", serve({ client: inngest, functions: [agentFunction] }))

const PORT = process.env.PORT || 3000

// Only start the server if not in a test environment
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(
      `[NODE-APP] Inngest server listening on http://localhost:${PORT}/api/inngest`
    )
  })
}
