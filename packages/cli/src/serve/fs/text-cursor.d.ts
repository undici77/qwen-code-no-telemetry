/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * A well-formed cursor is ~120 bytes of base64url. The cap exists so a
 * hostile client cannot make us parse megabytes before rejecting.
 */
export declare const MAX_TEXT_CURSOR_CHARS = 1024;
export interface TextCursorState {
    /** Byte offset the next page starts at. */
    off: number;
    /** File size when the cursor was minted, for shrink detection. */
    size: number;
    /** Device and inode as decimal strings — `Stats` fields may be `bigint`. */
    dev: string;
    ino: string;
}
export declare function encodeTextCursor(state: TextCursorState): string;
/**
 * Decode a client-supplied cursor. Shape problems are the client's fault
 * (`parse_error`); a cursor that decodes but no longer matches the file is a
 * concurrency problem (`hash_mismatch`), and that distinction is checked by
 * {@link assertCursorMatchesFile} once the file has been opened.
 */
export declare function decodeTextCursor(cursor: string): TextCursorState;
/**
 * Reject a cursor known stale through replacement or shrinkage.
 *
 * Growth is fine and is the point: appending to a log does not move the lines
 * an outstanding cursor points at. Shrinking is not — the offset may now land
 * mid-line or past the end, and the bytes there are not the ones the client
 * was reading.
 *
 * Residual: a same-inode rewrite that keeps or grows the file, or a
 * delete-and-recreate that reuses the inode, passes both checks. `mtimeMs`
 * cannot close that gap because both those cases and a valid append advance
 * it; hashing the prefix would make every page O(n), defeating the cursor.
 */
export declare function assertCursorMatchesFile(cursor: TextCursorState, stats: {
    dev: number | bigint;
    ino: number | bigint;
    size: number;
}, path: string): void;
