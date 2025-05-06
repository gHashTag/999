import "dotenv/config"
import { Inngest } from "inngest"
// import { log } from "@/utils/logic/logger"; // Assuming you have a custom logger

// Initialize Inngest Client and export it
export const inngest = new Inngest({
  id: "agentkit-tdd-agent",
  // logger: log, // Pass your custom logger if you have one and it's compatible
})
