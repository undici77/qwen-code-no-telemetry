/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Start early input capture
 * Call immediately after setting raw mode in gemini.tsx
 */
export declare function startEarlyInputCapture(): void;
/**
 * Stop early input capture
 * Call before KeypressProvider mounts
 */
export declare function stopEarlyInputCapture(): void;
/**
 * Get and clear captured input
 * For use by KeypressContext
 */
export declare function getAndClearCapturedInput(): Buffer;
/**
 * Stop capture and return captured input in one atomic operation.
 * Preferred over calling stopEarlyInputCapture + getAndClearCapturedInput separately.
 */
export declare function stopAndGetCapturedInput(): Buffer;
/**
 * Check if there is captured input
 */
export declare function hasCapturedInput(): boolean;
/**
 * Reset capture state (for testing only)
 */
export declare function resetCaptureState(): void;
