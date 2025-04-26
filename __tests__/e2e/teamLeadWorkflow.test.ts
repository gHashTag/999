// __tests__/e2e/teamLeadWorkflow.test.ts

// Basic imports for Vitest
import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { execSync } from "node:child_process"
import { readFileSync } from "node:fs"
import { join } from "node:path"

// Helper function for sleep
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Path to the log file
const logFilePath = join(__dirname, "..", "..", "node-app.log")

describe.sequential("TeamLead Agent Workflow E2E Test", () => {
  beforeAll(() => {
    // Optional: Clear log file before test run?
    // try { unlinkSync(logFilePath); } catch (e) { /* ignore */ }
  })

  // Test Step 1: Trigger TeamLead
  it("should trigger TeamLead and set status to NEEDS_TEST", async () => {
    const testTask = "E2E Test: Trigger TeamLead"
    console.log(`[TEST] Sending event with task: ${testTask}`)
    // Send event using the script (ensure Node.js path is correct)
    try {
      // Escape quotes for shell command
      const escapedTask = testTask.replace(/"/g, '\\"')
      execSync(`node scripts/send-test-event.mjs "${escapedTask}"`)
      console.log("[TEST] Event sent successfully.")
    } catch (error) {
      console.error("[TEST] Error sending event:", error)
      throw error // Fail the test if event sending fails
    }

    // Wait for processing (adjust timing as needed)
    console.log("[TEST] Waiting for event processing...")
    await sleep(15000) // Wait 15 seconds

    console.log(`[TEST] Reading log file: ${logFilePath}`)
    let logContent = ""
    try {
      logContent = readFileSync(logFilePath, "utf-8")
    } catch (error) {
      console.error(`[TEST] Error reading log file: ${logFilePath}`, error)
      // Don't throw here, let assertions fail
    }

    // --- Assertions ---
    // 1. Check if TeamLead agent ran
    expect(logContent).toMatch(/TEAMLEAD_LIFECYCLE/)
    console.log("[TEST] Verified: TEAMLEAD_LIFECYCLE found in log.")

    // 2. Check if state was set to NEEDS_TEST
    expect(logContent).toMatch(/Workflow initiated. State set to NEEDS_TEST/)
    console.log("[TEST] Verified: State set to NEEDS_TEST found in log.")
  }, 30000) // Increase timeout for this async test

  it.todo("should run TesterAgent and set status to NEEDS_COMMAND_EXECUTION")

  it.todo("should log command execution invocation from the handler")

  afterAll(() => {
    // Placeholder for cleanup
  })
})
