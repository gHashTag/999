/* eslint-disable no-console */
import process from "node:process"
// import net from "node:net"
// import http from "node:http"
import { config } from "dotenv"
import { resolve } from "path"

/**
 * Global setup function.
 * Loads environment variables and checks for E2B_API_KEY.
 */
export default async function setup() {
  // Load environment variables from .env file
  config({ path: resolve(process.cwd(), ".env") })

  const sandboxE2b = process.env.E2B_API_KEY

  if (!sandboxE2b) {
    console.warn(
      "E2B_API_KEY not found in environment variables. Skipping E2B setup."
    )
  }
  // Any other global setup logic can go here

  console.log("Global setup complete.")
  return null // Add return null to satisfy TypeScript
}

/**
 * Global teardown function (optional).
 */
export async function teardown() {
  console.log("Global teardown complete.")
}
