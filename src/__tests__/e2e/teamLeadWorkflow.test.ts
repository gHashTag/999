// __tests__/e2e/teamLeadWorkflow.test.ts

// Basic imports for Vitest
import { describe, it, expect } from "vitest"
// Import new utils
import { sendInngestEvent } from "./utils"
import { NetworkStatus } from "../../types/network"

describe("TeamLead Workflow", () => {
  it("should process initial task and transition to NEEDS_REQUIREMENTS_CRITIQUE", async () => {
    const initialTask = "Create a simple add function."
    const result = await sendInngestEvent("coding-agent/run", {
      input: initialTask,
    })

    expect(result).toBeDefined()
    expect(result.status).toBe(200)
    expect(result.body).toBeDefined()

    // Parse the response body to check the actual state
    const responseData = JSON.parse(result.body)
    expect(responseData).toBeDefined()
    expect(responseData.state).toBeDefined()
    expect(responseData.state.status).toBe(
      NetworkStatus.Enum.NEEDS_REQUIREMENTS_CRITIQUE
    )
    expect(responseData.state.task).toBe(initialTask)
    expect(responseData.state.test_requirements).toBeDefined()
  }, 60000) // Увеличиваем таймаут до 60 секунд

  // Другие тесты для следующих шагов рабочего процесса могут быть добавлены здесь
})
