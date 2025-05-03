// --- HTTP Server (Entry Point using Fastify) --- //
import { Hono } from "hono"
import { serve as honoServe } from "@hono/node-server"
import { serveStatic } from "@hono/node-server/serve-static"
import { serve as inngestServe } from "inngest/hono"
import { runCodingAgent } from "@/inngest"
import { Inngest } from "inngest"
import dotenv from "dotenv"

dotenv.config()

// Environment variables (remove unused)
const ENVIRONMENT = process.env.NODE_ENV || "development"
const SIGNING_KEY = process.env.INNGEST_SIGNING_KEY

// Basic validation
if (ENVIRONMENT !== "development" && !SIGNING_KEY) {
  console.error(
    "INNGEST_SIGNING_KEY is required in production. INNGEST_EVENT_KEY is recommended."
  )
  // process.exit(1); // Consider exiting in production
}

// Initialize Hono app
const app = new Hono()

// Setup Inngest client
export const inngest = new Inngest({
  id: "999-agent-runner",
})

// Middleware (optional, for logging, cors, etc.)
// app.use('*', logger()) // Example middleware

// Inngest endpoint using inngest/hono serve
app.on(
  ["GET", "POST", "PUT"],
  "/api/inngest",
  inngestServe({
    client: inngest,
    functions: [runCodingAgent],
    signingKey: SIGNING_KEY,
  })
)

// Basic root endpoint
app.get("/", c => {
  return c.text("999 Agent Server is running!")
})

// Health check endpoint
app.get("/health", c => {
  // Correct Hono handler signature
  return c.json({ status: "ok" })
})

// Serve static files (e.g., for reports)
app.use("/html/*", serveStatic({ root: "./" }))

// Start the server
const port = parseInt(process.env.APP_PORT || "8484")
console.log(`Server starting on port ${port}...`)

honoServe({
  fetch: app.fetch,
  port: port,
})

console.log(`Inngest functions served via /api/inngest endpoint.`)

// Export app for potential programmatic use (though Bun typically runs the file directly)
export default app
