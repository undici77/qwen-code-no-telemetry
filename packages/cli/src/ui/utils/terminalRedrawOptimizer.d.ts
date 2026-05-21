/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
export interface TerminalRedrawStatsSnapshot {
    stdoutWriteCount: number;
    stdoutBytes: number;
    clearTerminalCount: number;
    eraseLinesOptimizedCount: number;
}
export declare function getTerminalRedrawStatsSnapshot(): TerminalRedrawStatsSnapshot;
export declare function resetTerminalRedrawStats(): void;
/**
 * Ink clears dynamic output via ansi-escapes.eraseLines(), which emits a
 * clear-line + cursor-up pair for every previous line. That can make terminal
 * scrollback bounce during frequent streaming renders. Collapse the repeated
 * upward cursor movement while still clearing only the same old frame lines.
 */
export declare function optimizeMultilineEraseLines(output: string): string;
export declare function installTerminalRedrawOptimizer(stdout: NodeJS.WriteStream): () => void;
