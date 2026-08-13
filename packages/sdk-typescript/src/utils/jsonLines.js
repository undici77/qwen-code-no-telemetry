import { SdkLogger } from './logger.js';
export function serializeJsonLine(message) {
    try {
        return JSON.stringify(message) + '\n';
    }
    catch (error) {
        throw new Error(`Failed to serialize message to JSON: ${error instanceof Error ? error.message : String(error)}`);
    }
}
export function parseJsonLineSafe(line, context = 'JsonLines') {
    const logger = SdkLogger.createLogger(context);
    try {
        return JSON.parse(line);
    }
    catch (error) {
        logger.warn('Failed to parse JSON line, skipping:', line.substring(0, 100), error instanceof Error ? error.message : String(error));
        return null;
    }
}
export function isValidMessage(message) {
    return (message !== null &&
        typeof message === 'object' &&
        'type' in message &&
        typeof message.type === 'string');
}
export async function* parseJsonLinesStream(lines, context = 'JsonLines') {
    const logger = SdkLogger.createLogger(context);
    for await (const line of lines) {
        if (line.trim().length === 0) {
            continue;
        }
        const message = parseJsonLineSafe(line, context);
        if (message === null) {
            continue;
        }
        if (!isValidMessage(message)) {
            logger.warn("Invalid message structure (missing 'type' field), skipping:", line.substring(0, 100));
            continue;
        }
        yield message;
    }
}
//# sourceMappingURL=jsonLines.js.map