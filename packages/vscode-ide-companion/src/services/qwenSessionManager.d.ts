/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { QwenSession } from './qwenSessionReader.js';
/**
 * Qwen Session Manager
 *
 * This service provides direct filesystem access to load sessions.
 *
 * Note: Sessions are auto-saved by the CLI's ChatRecordingService.
 * This class is primarily used as a fallback mechanism for loading sessions
 * when ACP methods are unavailable or fail.
 */
export declare class QwenSessionManager {
    /**
     * Get the session directory for a project with backward compatibility
     */
    private getSessionDir;
    /**
     * Generate a new session ID
     */
    private generateSessionId;
    /**
     * Load a saved session by name
     *
     * @param sessionName - Name/tag of the session to load
     * @param workingDir - Current working directory
     * @returns Loaded session or null if not found
     */
    loadSession(sessionId: string, workingDir: string): Promise<QwenSession | null>;
    /**
     * List all saved sessions
     *
     * @param workingDir - Current working directory
     * @returns Array of session objects
     */
    listSessions(workingDir: string): Promise<QwenSession[]>;
    /**
     * Delete a saved session
     *
     * @param sessionId - ID of the session to delete
     * @param workingDir - Current working directory
     * @returns True if deleted successfully, false otherwise
     */
    deleteSession(sessionId: string, workingDir: string): Promise<boolean>;
}
