/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export interface WorkspaceMemoryFailureDiagnostics {
    details?: string;
    debugDetails: string;
    stack?: string;
}
type RememberErrorExtractionTarget = 'code' | 'details' | 'stack';
type WorkspaceMemoryExtractionLogger = {
    warn(message: string, context: {
        extractionError: string;
    }): void;
};
export declare function createWorkspaceMemoryExtractionErrorLogger(logger: WorkspaceMemoryExtractionLogger): (target: RememberErrorExtractionTarget, err: unknown) => void;
export declare function extractRememberErrorCode(err: unknown, fallback?: string): string;
export declare function workspaceMemoryFailureCode(err: unknown, fallback?: string, onExtractionError?: (target: RememberErrorExtractionTarget, err: unknown) => void): string;
export declare function extractRememberErrorDetails(err: unknown): string | undefined;
export declare function extractRememberErrorStack(err: unknown): string | undefined;
export declare function shouldSuppressRememberErrorDetails(code: string): boolean;
export declare function workspaceMemoryFailureDiagnostics(err: unknown, onExtractionError?: (target: RememberErrorExtractionTarget, err: unknown) => void): WorkspaceMemoryFailureDiagnostics;
export {};
