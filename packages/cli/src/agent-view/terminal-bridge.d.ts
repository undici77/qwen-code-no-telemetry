/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Readable, Writable } from 'node:stream';
export type AgentViewTerminalBytes = Buffer | Uint8Array | string;
export interface AgentViewTerminalDisposable {
    dispose(): void;
}
export interface AgentViewTerminalSize {
    columns: number;
    rows: number;
}
export interface AgentViewTerminalPty {
    write(data: Buffer): Promise<void> | void;
    onData(callback: (data: AgentViewTerminalBytes) => void): AgentViewTerminalDisposable | void;
    resize?(size: AgentViewTerminalSize): Promise<void> | void;
    pause?(): void;
    resume?(): void;
}
export type AgentViewTerminalInput = AsyncIterable<AgentViewTerminalBytes> | Readable;
export type AgentViewTerminalResizeSource = (callback: (size: AgentViewTerminalSize) => void) => AgentViewTerminalDisposable | void;
export interface AgentViewTerminalBridgeOptions {
    stdin: AgentViewTerminalInput;
    stdout: Writable;
    pty: AgentViewTerminalPty;
    detachSignal?: AbortSignal;
    onResize?: AgentViewTerminalResizeSource;
}
export interface AgentViewTerminalBridgeResult {
    reason: 'stdin-ended' | 'detached';
}
export declare function bridgeAgentViewTerminal(options: AgentViewTerminalBridgeOptions): Promise<AgentViewTerminalBridgeResult>;
