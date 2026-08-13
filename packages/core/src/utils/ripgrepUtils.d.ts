/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
export type RipgrepMode = 'builtin' | 'system';
export type RipgrepFailureKind = 'eagain' | 'timeout' | 'max_buffer' | 'exit' | 'spawn';
export interface RipgrepRecoveryMetadata {
    selectionMode: RipgrepMode;
    retryTriggered: boolean;
    retrySucceeded?: boolean;
    failureKind?: RipgrepFailureKind;
}
interface RipgrepSelection {
    mode: RipgrepMode;
    command: string;
}
export interface RipgrepRunResult {
    /**
     * The stdout output from ripgrep
     */
    stdout: string;
    /**
     * Whether ripgrep produced only partial results because execution did not
     * complete.
     */
    incomplete: boolean;
    /**
     * Any error that occurred during execution (non-fatal errors like no matches won't populate this)
     */
    error?: Error;
    recovery: RipgrepRecoveryMetadata;
}
export declare function _resetRipgrepUtilsCachesForTest(): void;
/**
 * Returns the path to the bundled ripgrep binary for the current platform
 * @returns The path to the bundled ripgrep binary, or null if not available
 */
export declare function getBuiltinRipgrep(): string | null;
/**
 * Checks if ripgrep binary exists and returns its path
 * @param useBuiltin If true, tries bundled ripgrep first, then falls back to system ripgrep.
 *                   If false, only checks for system ripgrep.
 * @returns The path to ripgrep binary ('rg' or 'rg.exe' for system ripgrep, or full path for bundled), or null if not available
 * @throws {Error} If an error occurs while resolving the ripgrep binary.
 */
export declare function resolveRipgrep(useBuiltin?: boolean): Promise<RipgrepSelection | null>;
/**
 * Ensures that ripgrep is healthy by checking its version.
 * @param selection The ripgrep selection to check.
 * @throws {Error} If ripgrep is not found or is not healthy.
 */
export declare function ensureRipgrepHealthy(selection: RipgrepSelection): Promise<void>;
export declare function ensureMacBinarySigned(selection: RipgrepSelection): Promise<void>;
/**
 * Checks if ripgrep binary is available
 * @param useBuiltin If true, tries bundled ripgrep first, then falls back to system ripgrep.
 *                   If false, only checks for system ripgrep.
 * @returns True if ripgrep is available, false otherwise.
 * @throws {Error} If an error occurs while resolving the ripgrep binary.
 */
export declare function canUseRipgrep(useBuiltin?: boolean): Promise<boolean>;
/**
 * Runs ripgrep with the provided arguments
 * @param args The arguments to pass to ripgrep
 * @param signal The signal to abort the ripgrep process
 * @param useBuiltin Whether to try the bundled ripgrep before falling back to system ripgrep
 * @returns The result of running ripgrep
 * @throws {Error} If an error occurs while running ripgrep.
 */
export declare function runRipgrep(args: string[], signal?: AbortSignal, useBuiltin?: boolean): Promise<RipgrepRunResult>;
export {};
