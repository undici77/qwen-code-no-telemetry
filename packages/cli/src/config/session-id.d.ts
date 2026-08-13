/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export type CallerSuppliedSessionIdParseResult = {
    kind: 'absent';
} | {
    kind: 'invalid';
} | {
    kind: 'valid';
    sessionId: string;
};
export declare function isValidSessionId(value: string): boolean;
/**
 * Canonicalize caller-visible UUIDs without changing internal or legacy IDs.
 * Internal Arena agent IDs and legacy IDs preserve their existing spelling.
 */
export declare function normalizeSessionIdForLookup(value: string): string;
export declare function parseCallerSuppliedSessionId(value: unknown): CallerSuppliedSessionIdParseResult;
