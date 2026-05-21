/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
type WriteRaw = (data: string) => void;
export interface TerminalNotification {
    notifyITerm2: (opts: {
        message: string;
        title?: string;
    }) => void;
    notifyKitty: (opts: {
        message: string;
        title: string;
        id: number;
    }) => void;
    notifyGhostty: (opts: {
        message: string;
        title: string;
    }) => void;
    notifyBell: () => void;
}
/**
 * Build a TerminalNotification object from a raw write function.
 * Useful when the caller already has stdout.write and does not need
 * (or cannot use) TerminalWriteContext (e.g. in AppContainer's body
 * before the provider is mounted in the JSX tree).
 */
export declare function buildTerminalNotification(writeRaw: WriteRaw): TerminalNotification;
export {};
