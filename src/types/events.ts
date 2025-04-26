import { z } from "zod"
// Import TddNetworkState for validation, not the zod schema directly
// import { TddNetworkState, tddNetworkStateSchema } from './network';
// import { TddNetworkState } from "./network"
// import { EventPayload } from "inngest"

// Define the main event payload schema
export const codingAgentEventSchema = z.object({
  input: z.string(),
  // currentState: tddNetworkStateSchema.optional(), // Используем явный тип, а не схему Zod
  // Temporarily use z.any() until full state management is robust
  currentState: z.any().optional(), // Using z.any() temporarily
})

// Тип для события
export type CodingAgentEventData = z.infer<typeof codingAgentEventSchema>

export type CodingAgentEvent = {
  name: "coding-agent/run"
  data: CodingAgentEventData
  id?: string // Add id property as optional
}
