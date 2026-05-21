/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * ACP File Operation Handler Class
 * Provides file read and write functionality according to ACP protocol specifications
 */
export declare class AcpFileHandler {
    /**
     * Handle read text file request
     *
     * @param params - File read parameters
     * @param params.path - File path
     * @param params.sessionId - Session ID
     * @param params.line - Starting line number (optional)
     * @param params.limit - Read line limit (optional)
     * @returns File content
     * @throws Error when file reading fails
     */
    handleReadTextFile(params: {
        path: string;
        sessionId: string;
        line: number | null;
        limit: number | null;
    }): Promise<{
        content: string;
    }>;
    /**
     * Handle write text file request
     *
     * @param params - File write parameters
     * @param params.path - File path
     * @param params.content - File content
     * @param params.sessionId - Session ID
     * @returns null indicates success
     * @throws Error when file writing fails
     */
    handleWriteTextFile(params: {
        path: string;
        content: string;
        sessionId: string;
    }): Promise<null>;
}
