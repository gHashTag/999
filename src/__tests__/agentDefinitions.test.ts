import { describe, beforeEach } from "vitest"

// Import the setup function
import { setupTestEnvironment } from "./agents/testSetup"

// Import the test runner functions
import { runTesterAgentTests } from "./agents/testerAgentTests"
import { runCodingAgentTests } from "./agents/codingAgentTests"
import { runCriticAgentTests } from "./agents/criticAgentTests"
// import { runToolingAgentTests } from "./agents/toolingAgentTests"; // Placeholder

describe("Agent Definitions", () => {
  // Setup mocks before each test suite defined below
  beforeEach(() => {
    setupTestEnvironment()
  })

  // --- Run Tests for createTesterAgent ---
  describe("createTesterAgent", () => {
    runTesterAgentTests() // Call the imported function
  })

  // --- Run Tests for createCodingAgent ---
  describe("createCodingAgent", () => {
    runCodingAgentTests() // Call the imported function
  })

  // --- Run Tests for createCriticAgent ---
  describe("createCriticAgent", () => {
    runCriticAgentTests() // Call the imported function
  })

  // --- Tests for createToolingAgent --- (Placeholder)
  // describe("createToolingAgent", () => {
  // runToolingAgentTests(); // Call when defined
  // })
}) // End of outer describe
