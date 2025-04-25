import { z } from "zod"
import { EventPayload } from "inngest"

// Define the main event payload schema
export const codingAgentEventSchema = z.object({
  input: z.string(),
})

export type CodingAgentEvent = EventPayload<{
  name: "coding-agent/run"
  data: z.infer<typeof codingAgentEventSchema>
}>

// Define a type for the network state
export interface TddNetworkState {
  task: string
  status: string
  sandboxId: string | null
  test_artifact_path?: string
  code_artifact_path?: string
  test_critique?: string
  code_critique?: string
  error?: string
  // Possibly unused fields from previous iterations
  test_code?: string
  current_code?: string
}
