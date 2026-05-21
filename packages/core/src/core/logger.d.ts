/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Content } from '@google/genai';
import type { Storage } from '../config/storage.js';
export declare enum MessageSenderType {
    USER = "user",
    MODEL_SWITCH = "model_switch"
}
export interface LogEntry {
    sessionId: string;
    messageId: number;
    timestamp: string;
    type: MessageSenderType;
    message: string;
}
export interface ModelSwitchEvent {
    fromModel: string;
    toModel: string;
    reason: 'vision_auto_switch' | 'manual' | 'fallback' | 'other';
    context?: string;
}
/**
 * Encodes a string to be safe for use as a filename.
 *
 * It replaces any characters that are not alphanumeric or one of `_`, `-`, `.`
 * with a URL-like percent-encoding (`%` followed by the 2-digit hex code).
 *
 * @param str The input string to encode.
 * @returns The encoded, filename-safe string.
 */
export declare function encodeTagName(str: string): string;
/**
 * Decodes a string that was encoded with the `encode` function.
 *
 * It finds any percent-encoded characters and converts them back to their
 * original representation.
 *
 * @param str The encoded string to decode.
 * @returns The decoded, original string.
 */
export declare function decodeTagName(str: string): string;
export declare class Logger {
    private readonly storage;
    private qwenDir;
    private logFilePath;
    private sessionId;
    private messageId;
    private initialized;
    private logs;
    private lastLoggedUserEntry;
    private writeQueue;
    private debugLogger;
    constructor(sessionId: string, storage: Storage);
    /**
     * Serializes a log-history mutation against every previously enqueued
     * op on this Logger. Errors propagate to the caller but do NOT poison
     * the queue (the next op runs regardless). Scope: only `logMessage`
     * and `removeLastUserMessage` go through here — checkpoint ops touch
     * separate files and don't share this queue. Single-instance only:
     * a separate Logger pointing at the same file would have its own
     * queue, which is why callers should share one Logger per session.
     */
    private serialize;
    private _readLogFile;
    private _backupCorruptedLogFile;
    initialize(): Promise<void>;
    private _updateLogFile;
    getPreviousUserMessages(): Promise<string[]>;
    logMessage(type: MessageSenderType, message: string): Promise<void>;
    /**
     * Undo the most recent {@link logMessage} call for a USER entry — used by
     * the auto-restore-on-cancel flow when the user hits ESC right after submit
     * and the model produced nothing meaningful. Without this, the cancelled
     * prompt would still surface in cross-session ↑-history via
     * {@link getPreviousUserMessages}.
     *
     * Mirrors claude-code's `removeLastFromHistory` (history.ts): one-shot,
     * clears the tracked entry so a second call is a no-op. Identifies the
     * entry by sessionId+messageId+timestamp+message so a stray race that
     * appended a different entry between log and undo will not silently
     * remove the wrong row.
     *
     * Two-phase semantics:
     *   1. Synchronous in-memory removal of the entry from `this.logs` —
     *      runs before this method even returns its Promise. Consumers
     *      that read `getPreviousUserMessages()` on the same render
     *      observe the removal immediately.
     *   2. Async serialized disk reconciliation — read, splice, writeFile.
     *      The returned Promise resolves to whether *the disk write*
     *      succeeded (not whether the in-memory removal happened).
     *
     * Failure handling: when the disk read or write THROWS, the optimistic
     * in-memory removal is ROLLED BACK so the cache stays consistent with
     * what's on disk (which is still the pre-call state). The target entry
     * is re-inserted at its original index (when still absent) and
     * `lastLoggedUserEntry` is restored so a follow-up retry has a target.
     *
     * The other `false`-returning paths intentionally do NOT roll back:
     *   - Initial guards (logger uninitialized / no tracked entry):
     *     nothing was removed in the first place, so nothing to restore.
     *   - Disk read succeeds but the tracked row is no longer on disk
     *     (e.g. another logger instance rotated/cleared the file): the
     *     in-memory cache is re-synced to the fresh disk snapshot, so
     *     both sides agree the entry is gone. Returning `false` here is
     *     truthful — we didn't perform a write — but the entry will NOT
     *     be observable in-memory either.
     *
     * @returns true when the disk row was actually removed; false otherwise.
     *   On `false`, the in-memory cache mirrors disk (entry restored if a
     *   disk op threw; entry stays gone if disk no longer had it).
     */
    removeLastUserMessage(): Promise<boolean>;
    private _checkpointPath;
    private _getCheckpointPath;
    saveCheckpoint(conversation: Content[], tag: string): Promise<void>;
    loadCheckpoint(tag: string): Promise<Content[]>;
    deleteCheckpoint(tag: string): Promise<boolean>;
    checkpointExists(tag: string): Promise<boolean>;
    close(): void;
}
