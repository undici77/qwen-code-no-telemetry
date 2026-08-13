/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Config, ServerGeminiStreamEvent, ToolCallRequestInfo, ToolCallResponseInfo } from '@qwen-code/qwen-code-core';
import type { PermissionSuggestion } from '../nonInteractive/types.js';
import type { Part } from '@google/genai';
/**
 * Structured-event kinds this bridge version is known to emit. Exposed to
 * consumers in `session_start.data.supported_events` so they can
 * feature-detect rather than sniffing the stream or hard-coding a minimum
 * CLI version.
 *
 * When adding a new event kind, append it here and bump the handshake
 * `protocol_version` below so consumers can gate on the combination.
 */
export declare const SUPPORTED_EVENTS: readonly ["system", "user", "assistant", "stream_event", "result", "control_request", "control_response"];
/**
 * Monotonically-increasing integer bumped whenever the wire protocol
 * changes in a way consumers might care about (new event types,
 * new payload fields that are not purely additive, etc.).
 *
 * History:
 *   1 — initial release (session_start, session_end, full stream-json).
 *   2 — textual tool_result content is bounded for transport.
 */
export declare const DUAL_OUTPUT_PROTOCOL_VERSION = 2;
/**
 * Optional metadata wired into the `session_start` capability handshake.
 */
export interface DualOutputBridgeOptions {
    /** CLI version string (e.g. "0.14.5"). Surfaced in session_start. */
    version?: string;
}
/**
 * Bridges TUI-mode events to a sidecar StreamJsonOutputAdapter that writes
 * structured JSON events to a secondary output channel (fd or file).
 *
 * This enables "dual output" mode: the TUI renders normally on stdout while
 * a parallel JSON event stream is emitted on a separate channel for
 * programmatic consumption by IDE extensions, web frontends, CI pipelines, etc.
 *
 * Usage:
 *   qwen --json-fd 3        # JSON events written to fd 3
 *   qwen --json-file /path  # JSON events written to file/FIFO
 */
export declare class DualOutputBridge {
    private readonly adapter;
    private readonly stream;
    private readonly sessionId;
    private active;
    private shutdownPromise;
    private readonly unsubscribeRecordingFailure;
    constructor(config: Config, target: {
        fd: number;
    } | {
        filePath: string;
    }, options?: DualOutputBridgeOptions);
    processEvent(event: ServerGeminiStreamEvent): void;
    startAssistantMessage(): void;
    finalizeAssistantMessage(): void;
    emitUserMessage(parts: Part[]): void;
    emitToolResult(request: ToolCallRequestInfo, response: ToolCallResponseInfo): void;
    /** Whether the underlying stream is still writable. */
    get isConnected(): boolean;
    private disableIfBufferOverflowed;
    /**
     * Emits a `can_use_tool` permission request so an external consumer can
     * approve or deny the tool call. Pairs with {@link emitControlResponse}.
     */
    emitPermissionRequest(requestId: string, toolName: string, toolUseId: string, input: unknown, blockedPath?: string | null, permissionSuggestions?: PermissionSuggestion[] | null): void;
    /**
     * Emits the result of a permission decision (made either in the TUI or by
     * the external consumer) so all observers stay in sync.
     */
    emitControlResponse(requestId: string, allowed: boolean): void;
    /**
     * Emits a `control_response` with subtype `error` — used when an external
     * `confirmation_response` cannot be satisfied (unknown request_id, the
     * tool call already resolved, stream already closed, etc.). Lets
     * consumers retry or surface the error instead of silently hanging.
     */
    emitControlError(requestId: string, message: string): void;
    /** General-purpose system event escape hatch. */
    emitSystemMessage(subtype: string, data?: unknown): void;
    private emitRecordingFailure;
    shutdown(): Promise<void>;
}
