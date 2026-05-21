/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Derive a deterministic 32-char hex traceId from a session ID.
 * Uses SHA-256 truncated to 128 bits to match the OTel trace ID format.
 * Shared by LogToSpanProcessor and debugLogger for consistent correlation.
 */
export declare function deriveTraceId(sessionId: string): string;
export declare function randomSpanId(): string;
export declare function randomHexString(length: number): string;
