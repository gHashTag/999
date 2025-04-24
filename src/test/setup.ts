import { beforeAll, afterEach, afterAll } from "vitest"
import { setupServer } from "msw/node"
import { handlers } from "../mocks/handlers.js"

// Setup requests interception using the given handlers.
const server = setupServer(...handlers)

// Start server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: "error" }))

// Reset handlers after each test `important for test isolation`
afterEach(() => server.resetHandlers())

// Clean up after all tests are done
afterAll(() => server.close())
