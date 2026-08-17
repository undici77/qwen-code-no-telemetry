/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { type RouteMapping } from './acpRouteTable.js';
/**
 * Match a URL path + HTTP method against the shared route table.
 */
export declare function matchRoute(
  path: string,
  httpMethod: string,
): {
  mapping: RouteMapping;
  segments: string[];
} | null;
/**
 * Create a synthetic `Response` object from a status code and body.
 */
export declare function synthesizeResponse(
  status: number,
  body: unknown,
): Response;
/**
 * Map a JSON-RPC error code to an HTTP status code.
 */
export declare function jsonRpcErrorToHttpStatus(code: number): number;
export declare function jsonRpcErrorToHttpStatusWithData(
  code: number,
  data?: unknown,
): number;
/**
 * Type guard for plain objects.
 */
export declare function isRecord(
  value: unknown,
): value is Record<string, unknown>;
/**
 * Compose multiple `AbortSignal` instances into one that aborts when
 * ANY of the inputs aborts. Uses `AbortSignal.any()` when available
 * (Node 20+), otherwise falls back to a manual wiring approach.
 */
export declare function composeAbortSignals(
  signals: AbortSignal[],
): AbortSignal;
/**
 * Merge transport-specific headers with caller-provided headers from
 * `RequestInit`. Caller headers take precedence for any conflicts.
 */
export declare function mergeHeaders(
  transportHeaders: Record<string, string>,
  initHeaders: HeadersInit | undefined,
): Record<string, string>;
