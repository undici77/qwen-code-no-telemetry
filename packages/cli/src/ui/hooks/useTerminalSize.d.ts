/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
interface TerminalSize {
    columns: number;
    rows: number;
}
/**
 * Returns the actual terminal size without any padding adjustments.
 * Components should handle their own margins/padding as needed.
 */
export declare function useTerminalSize(): TerminalSize;
export {};
