import { beforeAll, afterEach, afterAll } from "vitest"
import { setupServer } from "msw/node"
import { handlers } from "../mocks/handlers"

// Setup requests interception using the given handlers.
const server = setupServer(...handlers)

// Start server before all tests, ONLY if not running E2E tests
beforeAll(() => {
  if (process.env.VITEST_E2E !== "true") {
    console.log("MSW: Starting mock server for unit tests...") // Log for clarity
    server.listen({ onUnhandledRequest: "error" })
  } else {
    console.log("MSW: Skipping mock server setup for E2E tests.") // Log for clarity
  }
})

// Reset handlers after each test `important for test isolation`
afterEach(() => server.resetHandlers())

// Clean up after all tests are done
afterAll(() => server.close())
