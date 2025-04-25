// FIX: Remove problematic import
// import { sandboxId } from "../index.js"; // Assuming sandboxId is accessible globally or passed differently
// TODO: Improve how sandboxId is accessed. Maybe pass it to the log function?
/**
 * Helper for structured logging.
 * @param level - Log level ('info', 'warn', 'error')
 * @param stepName - Name of the step/context
 * @param message - Log message
 * @param data - Additional data object (can include sandboxId)
 */
export const log = (level, stepName, message, data = {}) => {
    // Attempt to get sandboxId from data if passed, otherwise null
    const currentSandboxId = data.sandboxId || null;
    console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level,
        step: stepName,
        sandboxId: currentSandboxId, // Log sandboxId if provided in data
        message,
        ...data, // Spread the rest of the data
    }, null, 2 // Pretty print JSON
    ));
};
//# sourceMappingURL=logger.js.map