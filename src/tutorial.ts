import { createAgent, createNetwork, anthropic } from "@inngest/agent-kit"
import { createServer } from "@inngest/agent-kit/server"

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
    // Use the model specified in the tutorial
    model: "claude-3-5-haiku-20240307", // Using specific Haiku version if 'latest' causes issues, fallback to tutorial's likely intent
    apiKey: process.env.ANTHROPIC_API_KEY, // Pass the API key
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
    // Use the model specified in the tutorial
    model: "claude-3-5-haiku-20240307", // Using specific Haiku version
    apiKey: process.env.ANTHROPIC_API_KEY, // Pass the API key
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
    // Use the model specified in the tutorial for the router
    model: "claude-3-5-haiku-20240307", // Using specific Haiku version
    apiKey: process.env.ANTHROPIC_API_KEY, // Pass the API key
    defaultParameters: {
      max_tokens: 1000, // Router might need fewer tokens, but keep consistency for now
    },
  }),
  // Note: No maxIter or custom router defined, using defaults as per tutorial
})

// Server Setup using createServer
console.log("Starting AgentKit server for tutorial...")
const server = createServer({
  agents: [dbaAgent, securityAgent], // Serve individual agents
  networks: [devOpsNetwork], // Serve the network
  // No specific client needed here as createServer handles it
})

const PORT = process.env.TUTORIAL_PORT || 3000 // Use a specific port or default

server.listen(PORT, () =>
  console.log(`Tutorial AgentKit server running on http://localhost:${PORT}!`)
)
