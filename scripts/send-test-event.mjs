#!/usr/bin/env node
/* eslint-env node */
import http from "http"
import chalk from "chalk"
import { program } from "commander"
import fetch from "node-fetch"

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

async function main() {
  program
    .option("-n, --eventName <name>", "Name of the event to send")
    .option("-d, --data <json>", "JSON data to send with the event")
    .option(
      "-u, --url <url>",
      "Inngest dev server URL",
      "http://localhost:8288"
    )
    .parse(process.argv)

  const args = program.opts()

  const eventName = args.eventName || "app/dummy.event"
  let eventData = {}

  if (args.data) {
    try {
      eventData = JSON.parse(args.data)
      // console.log("Parsed event data:", eventData)
    } catch (e) {
      console.error("Error parsing event data JSON:", e)
      process.exit(1)
    }
  } else {
    // console.log("No event data provided, sending empty object.")
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    // Add any other necessary headers, like Authorization if needed
  }

  const body = JSON.stringify({
    name: eventName,
    data: eventData,
  })

  const inngestUrl = `${args.url}/e/${eventName}`
  // console.log(`Sending event '${eventName}' to ${inngestUrl}...`)

  const options = {
    method: "POST",
    headers,
    body,
  }

  try {
    const response = await fetch(inngestUrl, options)

    // console.log("Inngest response status:", response.status)
    const responseBody = await response.text()
    // console.log("Inngest response body:", responseBody)

    if (!response.ok) {
      console.error(
        `Error sending event: ${response.status} ${response.statusText}`
      )
      console.error("Response body:", responseBody)
      throw new Error(
        `Failed to send event: ${response.status} ${response.statusText}`
      )
    } else {
      // console.log(`Event '${eventName}' sent successfully!`)
    }
  } catch (error) {
    console.error("Error sending event to Inngest:", error)
    process.exit(1)
  }
}

main()
