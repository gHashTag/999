import { createAgent, createNetwork, anthropic } from "@inngest/agent-kit"
import { createServer } from "@inngest/agent-kit/server"
// import { serve } from "@hono/node-server"
// import { Hono } from "hono"
// import { Inngest, type Context } from "inngest"
// import { serveStatic } from "@hono/node-server/serve-static"
import { log } from "@/utils/logic/logger" // Import the logger

// Check for API key (optional, but good practice)
if (!process.env.ANTHROPIC_API_KEY) {
  console.warn(
    "ANTHROPIC_API_KEY environment variable not set. Tutorial agents may not work."
  )
}

// Agent 1: Database Administrator
const dbaAgent = createAgent({
  name: "Database administrator",
  description: "Provides expert support for managing PostgreSQL databases",
  system:
    "You are a PostgreSQL expert database administrator. " +
    "You only provide answers to questions linked to Postgres database schema, indexes, extensions.",
  model: anthropic({
    model: "claude-3-haiku-20240307", // Corrected model name based on common availability
    apiKey: process.env.ANTHROPIC_API_KEY,
    defaultParameters: {
      max_tokens: 1000,
    },
  }),
})

// Agent 2: Database Security Expert
const securityAgent = createAgent({
  name: "Database Security Expert",
  description:
    "Provides expert guidance on PostgreSQL security, access control, audit logging, and compliance best practices",
  system:
    "You are a PostgreSQL security expert. " +
    "You only provide answers to questions linked to PostgreSQL security topics such as encryption, access control, audit logging, and compliance best practices.",
  model: anthropic({
    model: "claude-3-haiku-20240307", // Corrected model name
    apiKey: process.env.ANTHROPIC_API_KEY,
    defaultParameters: {
      max_tokens: 1000,
    },
  }),
})

// Network: DevOps Team
const devOpsNetwork = createNetwork({
  name: "DevOps team",
  agents: [dbaAgent, securityAgent],
  defaultModel: anthropic({
    model: "claude-3-haiku-20240307", // Corrected model name
    apiKey: process.env.ANTHROPIC_API_KEY,
    defaultParameters: {
      max_tokens: 1000,
    },
  }),
})

// Server Setup using createServer (for agents/network API)
log(
  "info",
  "TUTORIAL_SETUP",
  "Starting AgentKit server for tutorial agents/network..."
)
const agentServer = createServer({
  agents: [dbaAgent, securityAgent],
  networks: [devOpsNetwork],
})

const TUTORIAL_AGENT_PORT = process.env.TUTORIAL_PORT || 3001 // Use a different port for this server

// Use agentServer.listen instead of Hono's serve
agentServer.listen(TUTORIAL_AGENT_PORT, () =>
  log(
    "info",
    "TUTORIAL_AGENT_SERVER_READY",
    `Tutorial AgentKit Agent/Network server running on http://localhost:${TUTORIAL_AGENT_PORT}!`
  )
)

// Hono App Setup (Reduced as Inngest functionality is removed) - REMOVED
// const app = new Hono()
// const INNGEST_APP_PORT = 3000 // Port not needed if Hono isn't serving

// Correct Inngest Client Initialization - REMOVED as not used
// const inngest = new Inngest({
//   id: "tutorial-inngest-app",
// });

// Define the event structure if needed for type safety - REMOVED
// interface HelloWorldEvent {
//   name: "app/hello.world";
//   data: { name?: string };
// }

// Middleware for Inngest - REMOVED
// app.use("/api/inngest", inngest.createServeHandler());

// Serve static files for Inngest UI - REMOVED
// app.use("/inngest-ui/*", serveStatic({ root: "./node_modules/inngest/dist/ui" }));
// app.get("/", (c: any) => c.redirect("/inngest-ui/"));

// Remove the trigger endpoint - REMOVED
// app.get("/trigger", ...);

// Add a basic root route for the Hono app (Optional, if you want Hono for something else)
// app.get("/", (c) => c.text("Hono Server for Tutorial is Running!"));

// Start the Hono server - REMOVED as AgentKit server handles agents
// log("info", "TUTORIAL_HONO_START", "Starting Hono server for tutorial...");
// serve(
//   {
//     fetch: app.fetch,
//     port: INNGEST_APP_PORT,
//   },
//   (info: { address: string; port: number }) => {
//     log(
//       "info",
//       "TUTORIAL_HONO_READY",
//       `Tutorial Hono server running on http://${info.address}:${info.port}!`
//     );
//   }
// );
