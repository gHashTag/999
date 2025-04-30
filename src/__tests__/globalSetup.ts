/* eslint-disable no-console */
import process from "node:process"
import net from "node:net"
import http from "node:http"

const APP_PORT = parseInt(process.env.APP_PORT || "8484", 10)
const INNGEST_PORT = parseInt(process.env.INNGEST_PORT || "8288", 10)
const REQUIRED_ENV_VARS = ["DEEPSEEK_API_KEY"] // Add more if needed

// --- Helper Functions ---

/**
 * Checks if a TCP port is listening.
 * @param port The port number to check.
 * @param host The host (default: '127.0.0.1').
 * @returns Promise<boolean> True if listening, false otherwise.
 */
function checkPort(port: number, host = "127.0.0.1"): Promise<boolean> {
  return new Promise(resolve => {
    const socket = new net.Socket()

    socket.on("connect", () => {
      socket.end()
      resolve(true)
    })

    socket.on("timeout", () => {
      socket.destroy()
      resolve(false)
    })

    socket.on("error", err => {
      // Ignore connection refused errors, means port is not listening
      if ((err as NodeJS.ErrnoException).code !== "ECONNREFUSED") {
        console.error(`Error checking port ${port}:`, err)
      }
      resolve(false)
    })

    socket.setTimeout(1000) // 1 second timeout
    socket.connect(port, host)
  })
}

/**
 * Checks if a URL is accessible via a simple HTTP GET request.
 * @param urlString The URL to check.
 * @returns Promise<boolean> True if accessible (status 2xx/3xx), false otherwise.
 */
function checkUrl(urlString: string): Promise<boolean> {
  return new Promise(resolve => {
    const url = new URL(urlString)
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === "https:" ? 443 : 80),
      path: url.pathname + url.search,
      method: "GET",
      timeout: 2000, // 2 second timeout
    }

    const req = http.request(options, res => {
      // Consider 2xx and 3xx status codes as success
      const success =
        res.statusCode && res.statusCode >= 200 && res.statusCode < 400
      resolve(success || false)
      res.resume() // Consume response data to free up memory
    })

    req.on("timeout", () => {
      req.destroy()
      resolve(false)
    })

    req.on("error", err => {
      // Ignore connection refused, but log others
      if ((err as NodeJS.ErrnoException).code !== "ECONNREFUSED") {
        console.error(`Error checking URL ${urlString}:`, err)
      }
      resolve(false)
    })

    req.end()
  })
}

// --- Global Setup Function ---

export default async function setup() {
  console.log("\\n🕉️ Running Global Test Setup: Checking Environment...")

  // 1. Check Environment Variables
  console.log("   🔍 Checking required environment variables...")
  const missingVars = REQUIRED_ENV_VARS.filter(varName => !process.env[varName])
  if (missingVars.length > 0) {
    throw new Error(
      `❌ FAILED: Missing required environment variables: ${missingVars.join(", ")}`
    )
  }
  console.log("      ✅ Environment variables OK.")

  // 2. Check Inngest Dev Server Port
  console.log(`   🔍 Checking Inngest Dev Server port (${INNGEST_PORT})...`)
  const isIngestPortListening = await checkPort(INNGEST_PORT)
  if (!isIngestPortListening) {
    throw new Error(
      `❌ FAILED: Port ${INNGEST_PORT} (Inngest Dev Server) is not listening. Ensure 'pnpm run dev:serve' is running.`
    )
  }
  console.log(`      ✅ Port ${INNGEST_PORT} is listening.`)

  // 3. Check App Server Port
  console.log(`   🔍 Checking App Server port (${APP_PORT})...`)
  const isAppPortListening = await checkPort(APP_PORT)
  if (!isAppPortListening) {
    console.error(
      `❌ FAILED: Port ${APP_PORT} (App Server) is not listening. Ensure 'bun run dev:start' is running.`
    )
    return false
  } else {
    console.log(`      ✅ Port ${APP_PORT} is listening.`)
  }

  // 4. Check Inngest Dev Server URL
  const ingestUrl = `http://localhost:${INNGEST_PORT}/`
  console.log(`   🔍 Checking Inngest Dev Server URL (${ingestUrl})...`)
  const isIngestUrlAccessible = await checkUrl(ingestUrl)
  if (!isIngestUrlAccessible) {
    throw new Error(
      `❌ FAILED: Cannot connect to Inngest Dev Server at ${ingestUrl}.`
    )
  }
  console.log(`      ✅ Inngest Dev Server URL OK.`)

  // 5. Check App Server Inngest Endpoint
  const appIngestUrl = `http://localhost:${APP_PORT}/api/inngest`
  console.log(`   🔍 Checking App Inngest Endpoint (${appIngestUrl})...`)
  const isAppIngestUrlAccessible = await checkUrl(appIngestUrl)
  if (!isAppIngestUrlAccessible) {
    console.error(
      `❌ FAILED: Cannot connect to App Inngest Endpoint at ${appIngestUrl}.`
    )
    return false
  } else {
    console.log(`      ✅ App Inngest Endpoint OK.`)
  }

  console.log("✅ Global Test Setup Completed Successfully.\\n")

  // Optional: Define teardown function if needed
  // return async () => {
  //   console.log("\\n🕉️ Running Global Test Teardown...");
  //   // Cleanup logic here
  // };
}
