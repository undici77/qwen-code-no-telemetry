/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Recovers parsed objects from a single physical line that may contain one
 * or more concatenated top-level JSON objects (i.e. a missing newline
 * separator left two records glued together as `}{`). Walks the line with a
 * brace-depth counter that respects string boundaries and `\` escapes, then
 * tries `JSON.parse` on each balanced top-level fragment. Fragments that
 * still fail to parse are skipped silently — the caller decides whether to
 * warn.
 *
 * **Limitation**: only top-level `{...}` records are recovered. A glued line
 * whose records are top-level arrays (`[...][...]`) will not split. All
 * existing JSONL writers in this codebase produce object records, so this
 * matches the actual corruption shape — extend if that ever changes.
 *
 * Exported for unit tests; not part of the module's stable surface.
 */
export declare function _recoverObjectsFromLine<T = unknown>(line: string): T[];
/**
 * Parses a single physical JSONL line tolerantly. Returns the parsed records:
 * one if the line is well-formed, multiple if it is `}{`-glued from an
 * interrupted append (the #3606 corruption shape), zero if nothing can be
 * recovered. Use this from any streaming reader that walks JSONL line-by-line
 * and wants the same recovery semantics as `read()` / `readLines()`.
 *
 * Non-object JSON values (e.g. a bare `null`, `42`, or `[1,2,3]` line) are
 * filtered out: JSONL records in this codebase are always objects, and
 * forwarding scalars or arrays would trip property accesses in callers
 * (`record.type`, `record.uuid`).
 */
export declare function parseLineTolerant<T>(line: string, filePath: string): T[];
/**
 * Reads the first N lines from a JSONL file efficiently.
 * Returns an array of parsed objects.
 */
export declare function readLines<T = unknown>(filePath: string, count: number): Promise<T[]>;
/**
 * Reads all lines from a JSONL file.
 * Returns an array of parsed objects.
 */
export declare function read<T = unknown>(filePath: string): Promise<T[]>;
/**
 * Test-only: clear the per-directory mkdir cache. Needed when tests mutate
 * fs state at the same directory path across cases.
 */
export declare function _resetEnsuredDirsCacheForTest(): void;
/**
 * Appends a line to a JSONL file with concurrency control.
 * Uses a per-file mutex so concurrent callers serialize, and `fs.promises`
 * so the actual I/O does not block the event loop.
 */
export declare function writeLine(filePath: string, data: unknown): Promise<void>;
/**
 * Synchronous version of writeLine for use in non-async contexts.
 * Uses a simple flag-based locking mechanism (less robust than async version).
 */
export declare function writeLineSync(filePath: string, data: unknown): void;
/**
 * Overwrites a JSONL file with an array of objects.
 * Each object will be written as a separate line.
 */
export declare function write(filePath: string, data: unknown[]): void;
/**
 * Counts the number of non-empty lines in a JSONL file.
 */
export declare function countLines(filePath: string): Promise<number>;
/**
 * Checks if a JSONL file exists and is not empty.
 */
export declare function exists(filePath: string): boolean;
