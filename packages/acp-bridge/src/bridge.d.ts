/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { AcpSessionBridge } from './bridgeTypes.js';
import type { BridgeOptions } from './bridgeOptions.js';
/**
 * Extract a human-readable message from an unknown error value.
 * Handles Error instances, JSON-RPC error objects (`{ code, message,
 * data: { details } }`, `{ data: { message } }`, or string `data`), and plain
 * objects with a `message` property.
 * JSON-RPC internal errors carry the generic `"Internal error"` as
 * `message`; the actual detail often lives in `data.details` or
 * provider-specific `data.message`.
 */
export declare function extractErrorMessage(err: unknown): string;
export declare function extractErrorCode(err: unknown): string | undefined;
export declare function classifyTurnErrorKind(message: string): 'model_stream_interrupted' | undefined;
export declare function createAcpSessionBridge(opts: BridgeOptions): AcpSessionBridge;
/** @deprecated Use `createAcpSessionBridge` instead. */
export declare const createHttpAcpBridge: typeof createAcpSessionBridge;
