#!/usr/bin/env node
/* eslint-env node */
import http from "http"
import chalk from "chalk"

// --- Configuration ---
const DEV_SERVER_URL = "http://localhost:8288"
// WARNING: Hardcoding the event key is not ideal for security/flexibility.
// Consider moving to an environment variable (e.g., process.env.INNGEST_EVENT_KEY)
// For now, using the key provided earlier in the conversation.
const EVENT_KEY =
  "a9tBvZMPD66QNEy3goIPmrSZ6tin2SQ1jWANGG148rbeCgB0CWaqYTc49slfyOnUmGDABBK1G1VKRPRUeEZUWA"
const TARGET_URL = `${DEV_SERVER_URL}/e/${EVENT_KEY}`

const eventPayload = {
  name: "coding-agent/run",
  data: {
    // Default test payload
    input:
      "Create a file named 'test-output.txt' containing the text 'Manual test successful!'",
  },
}

// Allow overriding input via command line argument
if (process.argv[2]) {
  try {
    // Use the command line argument directly as the input string
    // eventData = JSON.parse(process.argv[2]); // Don't parse if we expect input: string
    // We expect the schema { input: string, currentState?: any }
    // Construct the object correctly
    eventPayload.data = { input: process.argv[2] }
    console.log("Using event data from command line argument.")
    // console.log("Using event data from command line argument (parsed as JSON).");
  } catch (error) {
    console.error(
      "Failed to parse command line argument as JSON. Using default data.",
      error
    )
    // Construct the default object correctly
    eventPayload.data = { input: "Default task from script" }
  }
} else {
  console.log("No command line argument provided. Using default event data.")
  // Construct the default object correctly
  eventPayload.data = { input: "Default task from script" }
}

// Ensure eventData always has the 'input' key expected by the schema
if (typeof eventPayload.data.input !== "string") {
  console.warn(
    "Event data does not have a valid 'input' string. Using default."
  )
  eventPayload.data = { input: "Default fallback task" }
}

const postData = JSON.stringify(eventPayload)

const options = {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(postData),
  },
}

console.log(`Sending event '${eventPayload.name}' to ${TARGET_URL}...`)
console.log("Event data:", eventPayload.data) // Log the actual data being sent

const req = http.request(TARGET_URL, options, res => {
  console.log(`STATUS: ${res.statusCode}`)
  console.log(`HEADERS: ${JSON.stringify(res.headers)}`)
  let responseBody = ""
  res.setEncoding("utf8")
  res.on("data", chunk => {
    responseBody += chunk
  })
  res.on("end", () => {
    console.log("BODY:", responseBody)
    if (res.statusCode !== 200) {
      console.error("Error sending event!")
      process.exit(1) // Exit with error code if status is not 200
    }
  })
})

req.on("error", e => {
  console.error(`Problem with request: ${e.message}`)
  if (e.code === "ECONNREFUSED") {
    console.error(
      chalk.red.bold("Error:"),
      chalk.red(e.message),
      chalk.yellow(
        `\n>>> Is the Inngest Dev Server (bun run dev:serve) running at ${DEV_SERVER_URL} ? <<<\n`
      )
    )
  }
  process.exit(1) // Exit with error code
})

// Write data to request body
req.write(postData)
req.end()
