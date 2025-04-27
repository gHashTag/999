// --- HTTP Server (Entry Point using Fastify) --- //
import Fastify, { FastifyInstance } from "fastify" // Import FastifyInstance for typing
import { fastifyPlugin } from "inngest/fastify"
// import { type InngestFunction } from "inngest" // Revert this import
import { log } from "@/utils" // Import log
import { inngest, runCodingAgent } from "@/inngest/index" // Import client and CORRECT function name
import { pathToFileURL } from "node:url" // Import pathToFileURL

// Create Fastify instance with explicit type
const app: FastifyInstance = Fastify({ logger: false })

// Serve the Inngest function(s) using the plugin
app.register(fastifyPlugin, {
  client: inngest,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  functions: [runCodingAgent] as any[], // Revert back to any[] for now
})

const APP_PORT = parseInt(process.env.APP_PORT || "8484", 10) // Ensure port is number

// Define the start function
export const start = async () => {
  try {
    await app.listen({ port: APP_PORT, host: "0.0.0.0" })
    log(
      "info",
      "SERVER_START",
      `Fastify server listening on http://localhost:${APP_PORT}/api/inngest`,
      { port: APP_PORT }
    )
  } catch (err) {
    log("error", "SERVER_ERROR", "Error starting Fastify server", {
      error: (err as Error).message,
    })
    process.exit(1)
  }
}

// Only start the server if not in a test environment AND this file is run directly
if (
  process.env.NODE_ENV !== "test" &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  start()
}

// Export app for vite-plugin-node
export { app }
