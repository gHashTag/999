#!/usr/bin/env node
/* eslint-env node */
import http from "http"

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
    // Attempt to parse as JSON first
    const argData = JSON.parse(process.argv[2])
    eventPayload.data = argData
    console.log("Using event data from command line argument (parsed as JSON).")
  } catch /* (e) */ {
    // Fallback to treating as a simple string input
    eventPayload.data.input = process.argv[2]
    console.log("Using event input string from command line argument.")
  }
} else {
  console.log("Using default test event data.")
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
      `\n>>> Is the Inngest Dev Server (pnpm run dev) running at ${DEV_SERVER_URL} ? <<<\n`
    )
  }
  process.exit(1) // Exit with error code
})

// Write data to request body
req.write(postData)
req.end()
