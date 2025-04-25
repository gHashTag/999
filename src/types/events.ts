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
