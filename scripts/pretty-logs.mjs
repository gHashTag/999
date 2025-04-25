#!/usr/bin/env node
import prettyFactory from "pino-pretty"
import readline from "readline"
import { PassThrough } from "stream"

// Define Emojis for levels
const levelEmojis = {
  60: "❌", // fatal
  50: "❌", // error
  40: "⚠️", // warn
  30: "✅", // info
  20: "⚙️", // debug
  10: "👀", // trace
}

// Default emoji for unknown levels
const defaultEmoji = "🪵"

const prettyStream = prettyFactory({
  colorize: true, // Let's still try to enable colors
  ignore: "pid,hostname", // Ignore these fields
  translateTime: "HH:MM:ss.l", // Human-readable time format
  // Custom message format function
  messageFormat: (log, messageKey, levelLabel, { colors }) => {
    const emoji = levelEmojis[log.level] || defaultEmoji
    const step = log.step ? `[${log.step}]` : ""
    const msg = log[messageKey] || ""
    const context = []
    if (log.eventId) {
      // Truncate eventId for brevity
      const shortEventId = String(log.eventId).substring(0, 8)
      context.push(`Evt:${shortEventId}`)
    }
    if (log.sandboxId) {
      // Truncate sandboxId for brevity
      const shortSandboxId = String(log.sandboxId).substring(0, 8)
      context.push(`Box:${shortSandboxId}`)
    }
    const contextString = context.length > 0 ? `(${context.join(" | ")})` : ""

    // Construct the final log line
    // Example: [16:47:18.262] ✅ [GET_SANDBOX_ID_END] (Evt:01JSPXH9 | Box:iatdwa8d) Got sandbox ID.
    // Level label (INFO, WARN etc.) is added automatically by pino-pretty before this format

    // We manually construct the string, pino-pretty adds time and level label before it
    return `${emoji} ${step} ${contextString} ${msg}`
  },
})

// Read from stdin line by line
const rl = readline.createInterface({
  input: process.stdin,
  output: new PassThrough(), // We don't want readline to output anything itself
  terminal: false, // Ensure it reads from pipe
})

rl.on("line", line => {
  // Write each line to the pretty stream for formatting
  prettyStream.write(line + "\n") // Add newline as pino-pretty expects it
})

// Pipe the formatted output to stdout
prettyStream.pipe(process.stdout)

// Handle stream closing
process.stdin.on("end", () => {
  // console.error('Stdin stream ended.'); // For debugging if needed
})

prettyStream.on("error", error => {
  console.error("Error in pretty stream:", error)
})

process.stdout.on("error", error => {
  // Handle EPIPE error, which can happen if the downstream process closes
  if (error.code !== "EPIPE") {
    console.error("Error writing to stdout:", error)
  }
})

// Keep the process running until stdin closes
process.stdin.resume()
