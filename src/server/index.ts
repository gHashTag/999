// --- HTTP Server (Entry Point using Fastify) --- //
import { fastify } from "fastify"
import { Inngest } from "inngest"
import { serve } from "@inngest/fastify"
import { agentFunction, runCodingAgent } from "@/inngest"
import { log } from "@/utils/logic"
import dotenv from "dotenv"

dotenv.config()

// --- Configuration ---
const APP_PORT = parseInt(process.env.APP_PORT || "8484", 10)
const SIGNING_KEY = process.env.INNGEST_SIGNING_KEY
const EVENT_KEY = process.env.INNGEST_EVENT_KEY
const ENVIRONMENT = process.env.NODE_ENV || "development"

// Basic validation
if (ENVIRONMENT !== "development" && !SIGNING_KEY) {
  log.error(
    "INNGEST_SIGNING_KEY is required in production. INNGEST_EVENT_KEY is recommended."
  )
  // process.exit(1); // Consider exiting in production
}

// Initialize Fastify
const app = fastify()

// Initialize Inngest client
const inngest = new Inngest({ id: "999-project", eventKey: EVENT_KEY })

// Serve Inngest API handler
app.register(serve, {
  client: inngest,
  functions: [agentFunction, runCodingAgent], // Your Inngest functions
  signingKey: SIGNING_KEY,
  logLevel: process.env.LOG_LEVEL || "info", // Control Inngest handler logging
})

// Basic health check endpoint
app.get("/")

// Basic health check endpoint
app.get("/health", async (request, reply) => {
  log.info("Health check request received.")
  reply.send({ status: "ok" })
})

// Start the server
const start = async () => {
  try {
    await app.listen({ port: APP_PORT, host: "0.0.0.0" })
    log.info(`Server listening on port ${APP_PORT}`)
  } catch (err) {
    log.error("Error starting server:", err)
    process.exit(1)
  }
}

start()

// Export app for potential programmatic use (though Bun typically runs the file directly)
export { app }
