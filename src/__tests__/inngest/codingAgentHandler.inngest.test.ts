import { InngestTestEngine } from "@inngest/test"

// Временная заглушка для codingAgentHandler
const codingAgentHandler = {} as any

test.skip("should complete full TDD cycle: TeamLead -> Coder -> TypeCheck -> Tester -> Critic", async () => {
  const t = new InngestTestEngine({
    fn: codingAgentHandler,
  })

  const result = await t.execute({
    event: {
      name: "coding-agent/run",
      data: { task_description: "Generate a Hello World program" },
    },
    steps: [
      {
        id: "run-agent-network-teamlead",
        handler: async () => {
          // Mock TeamLead response
          return {
            state: {
              kv: {
                data: {
                  status: "NEEDS_CODE",
                  test_requirements: ["Requirement 1", "Requirement 2"],
                  test_code: "test code content",
                },
              },
            },
          }
        },
      },
      {
        id: "run-agent-network-coder",
        handler: async () => {
          // Mock Coder response
          return {
            state: {
              kv: {
                data: {
                  status: "NEEDS_TYPE_CHECK",
                  implementation_code: 'console.log("Hello, World!");',
                },
              },
            },
          }
        },
      },
      {
        id: "run-type-check",
        handler: async () => {
          return { success: true, errors: null }
        },
      },
      {
        id: "run-tests",
        handler: async () => {
          return { success: true, output: "Tests passed!" }
        },
      },
      {
        id: "run-agent-network-tester",
        handler: async () => {
          // Mock Tester response
          return {
            state: {
              kv: {
                data: {
                  status: "NEEDS_IMPLEMENTATION_CRITIQUE",
                },
              },
            },
          }
        },
      },
      {
        id: "run-agent-network-critic",
        handler: async () => {
          // Mock Critic response
          return {
            state: {
              kv: {
                data: {
                  status: "COMPLETED",
                  critique: {
                    approved: true,
                    critique: "LGTM!",
                    refactored_code: null,
                  },
                },
              },
            },
          }
        },
      },
    ],
  })

  expect(result).toBeDefined()
  // Проверяем, что финальный статус - COMPLETED
  expect(result.finalStatus).toBe("COMPLETED")
})
