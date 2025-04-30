import { beforeAll, afterEach, afterAll } from "bun:test" // Changed bun:test to bun:test
import { setupServer } from "msw/node"
import { handlers } from "../mocks/handlers"

// Setup requests interception using the given handlers.
const server = setupServer(...handlers)

// Start server before all tests, ONLY if not running E2E tests
beforeAll(() => {
  // Remove condition based on VITEST_E2E
  // if (process.env.VITEST_E2E !== "true") {
  // console.log("MSW: Starting mock server for unit tests...") // Log for clarity
  server.listen({ onUnhandledRequest: "error" })
  // } else {
  // console.log("MSW: Skipping mock server setup for E2E tests.") // Log for clarity
  // }
})

// Reset handlers after each test `important for test isolation`
afterEach(() => server.resetHandlers())

// Clean up after all tests are done
afterAll(() => server.close())

// Example Global Setup (Comments referencing React Testing Library removed)

// Runs once before all tests
beforeAll(() => {
  // console.log("Setting up global test environment...");
  // Perform any global setup, e.g., configuring jsdom or mocks
})

// Runs after each test file
afterAll(() => {
  // console.log("Tearing down global test environment...");
  // Perform any global teardown
})

// Runs after each test case
afterEach(() => {
  // Add any other cleanup needed between tests
})
