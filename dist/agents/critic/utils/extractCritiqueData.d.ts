import type { AgentResult } from "@inngest/agent-kit";
import type { CritiqueData, LoggerFunc } from "../../../types/agents";
/**
 * Extracts critique data from an agent's result.
 * Improved type checking for message content.
 */
export declare function extractCritiqueData(result: AgentResult | undefined, log: LoggerFunc): CritiqueData;
//# sourceMappingURL=extractCritiqueData.d.ts.map