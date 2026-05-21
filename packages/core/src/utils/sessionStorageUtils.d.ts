/**
 * @license
 * Copyright 2025 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */
/** Size of the head/tail buffer for lite metadata reads (64KB). */
export declare const LITE_READ_BUF_SIZE: number;
/**
 * Unescape a JSON string value extracted as raw text.
 * Only allocates a new string when escape sequences are present.
 */
export declare function unescapeJsonString(raw: string): string;
/**
 * Extracts a simple JSON string field value from raw text without full parsing.
 * Looks for `"key":"value"` or `"key": "value"` patterns.
 * Returns the first match, or undefined if not found.
 */
export declare function extractJsonStringField(text: string, key: string): string | undefined;
/**
 * Like extractJsonStringField but finds the LAST well-formed occurrence of
 * `primaryKey` and returns every `otherKeys` value extracted from THAT SAME
 * line. Two separate `extractLastJsonStringField` calls can land on different
 * records when an older line contains only one of the fields — this function
 * guarantees the returned fields all come from the same record.
 *
 * Validation: a primary-key match counts only when its string value has a
 * proper closing quote. A crash-truncated trailing record (`"customTitle":"x`
 * with no closing `"`) is ignored — otherwise it could "win" the latest-match
 * race and cause the function to extract secondaries from a partial line
 * where they don't appear.
 *
 * When `lineContains` is provided, only lines containing that substring are
 * considered matches (same semantics as the single-field version).
 */
export declare function extractLastJsonStringFields(text: string, primaryKey: string, otherKeys: string[], lineContains?: string): Record<string, string | undefined>;
/**
 * Like extractJsonStringField but finds the LAST occurrence.
 * Useful for fields that are appended (customTitle, aiTitle, etc.)
 * where the most recent entry should win.
 *
 * When `lineContains` is provided, only matches on lines that also contain
 * the given substring are considered. This prevents false matches from user
 * content that happens to contain the same key pattern.
 */
export declare function extractLastJsonStringField(text: string, key: string, lineContains?: string): string | undefined;
/**
 * Reads a JSON string field value from a JSONL file, returning the latest
 * occurrence (last in file order).
 *
 * Two bounded windows, never a full-file scan:
 *   1. Scan the last LITE_READ_BUF_SIZE bytes of the file. This is the
 *      common path because `ChatRecordingService` re-anchors metadata
 *      records to EOF every 32KB (the title re-anchor threshold, below
 *      the tail-window size) and on every lifecycle event (turn end,
 *      session switch, shutdown, resume).
 *   2. If the tail has no match, scan the FIRST LITE_READ_BUF_SIZE bytes
 *      of the file. The metadata record set on a brand-new session lands
 *      near offset 0 before any user/assistant turns push it forward, so
 *      the head window catches the legacy case where a session was
 *      created on a build prior to the re-anchor invariant.
 *
 * If neither window contains the field, returns `undefined`. Callers
 * that need a stronger guarantee must arrange for the writer to
 * maintain the head-or-tail invariant — by design we never trade
 * picker latency for completeness here.
 *
 * Normal worst-case I/O: 2 × LITE_READ_BUF_SIZE = 128KB per file.
 * If a concurrent writer grows the file between the initial stat and a
 * tail miss, we do one extra latest-tail read to catch a fresh EOF anchor
 * while preserving a fixed retry bound.
 *
 * @param lineContains Optional substring that must appear on the same line
 *   as the matched field. See {@link extractLastJsonStringField}.
 * @param scratchBuffer Optional caller-owned Buffer reused across many
 *   files in the same listing pass. Must be at least
 *   {@link LITE_READ_BUF_SIZE} bytes; only the leading `length` bytes
 *   are touched and decoded each call, so old data past the read region
 *   is never observed (we never read past the bytes we just wrote).
 *   The same buffer backs both the tail and head reads — they happen
 *   sequentially, so reuse is safe. When omitted, the function
 *   allocates per-call — preserves the simple call site for one-off
 *   reads (rename, single-session lookup) while letting `listSessions`
 *   skip the per-file alloc.
 */
export declare function readLastJsonStringFieldSync(filePath: string, key: string, lineContains?: string, scratchBuffer?: Buffer): string | undefined;
/**
 * Like {@link readLastJsonStringFieldSync} but extracts multiple fields from
 * the same matching line atomically (single file scan, consistent pair).
 *
 * The primary key determines the "winning" line (latest occurrence on a line
 * that also contains `lineContains`). Every other requested field is pulled
 * from that same line — never from an earlier or later record — so callers
 * get a consistent record snapshot. Useful when a record pairs a payload
 * field with its metadata (e.g. `customTitle` + `titleSource`).
 *
 * Missing fields (primary or secondary) appear in the returned object with
 * value `undefined`. I/O errors yield `undefined` for every key.
 */
export declare function readLastJsonStringFieldsSync(filePath: string, primaryKey: string, otherKeys: string[], lineContains?: string, scratchBuffer?: Buffer): Record<string, string | undefined>;
