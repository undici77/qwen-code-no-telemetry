/**
 * UUID validation utilities
 */
/**
 * Validates if a string is a valid UUID format
 * @param value - The string to validate
 * @returns True if the string is a valid UUID, false otherwise
 */
export declare function isValidUUID(value: string): boolean;
/**
 * Validates a session ID and throws an error if invalid
 * @param sessionId - The session ID to validate
 * @param paramName - The name of the parameter (for error messages)
 * @throws Error if the session ID is not a valid UUID
 */
export declare function validateSessionId(sessionId: string, paramName?: string): void;
