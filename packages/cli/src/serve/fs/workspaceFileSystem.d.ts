/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { type Ignore, type WriteTextFileOptions } from '@qwen-code/qwen-code-core';
import type { BridgeEvent } from '../eventBus.js';
import { type AuditContext } from './audit.js';
import { type Intent, type ResolvedPath } from './paths.js';
import { MAX_READ_BYTES } from './policy.js';
/**
 * Stat snapshot returned by `WorkspaceFileSystem.stat`. We
 * deliberately avoid passing through `fs.Stats` directly — the
 * boundary should not leak Node-specific bigint quirks or
 * platform-specific fields to PR 19/20 SDK consumers.
 */
export interface FsStat {
    kind: 'file' | 'directory' | 'symlink' | 'other';
    sizeBytes: number;
    modifiedMs: number;
}
/** Directory listing entry from `WorkspaceFileSystem.list`. */
export interface FsEntry {
    name: string;
    kind: 'file' | 'directory' | 'symlink' | 'other';
    /** True iff the entry matched a `.gitignore`/`.qwenignore` rule. */
    ignored: boolean;
}
/** Metadata side-channel returned alongside `readText` content. */
export interface ReadMeta {
    encoding?: string;
    bom?: boolean;
    lineEnding: 'crlf' | 'lf';
    sizeBytes?: number;
    hash?: ContentHash;
    truncated?: boolean;
    matchedIgnore?: 'file' | 'directory';
    originalLineCount?: number;
}
export interface ReadTextOptions {
    /** Cap returned bytes; defaults to MAX_READ_BYTES. */
    maxBytes?: number;
    /**
     * 1-based starting line for partial reads. `1` returns the file
     * from its first line. The boundary converts to the 0-based slice
     * index `readFileWithLineAndLimit` expects internally; SDK
     * consumers don't need to adjust. Values < 1 (or undefined) are
     * treated as "from the beginning".
     */
    line?: number;
    /** Maximum number of lines to return. */
    limit?: number;
}
export interface ListOptions {
    /** When true, ignored entries are returned with `ignored: true` rather than dropped. */
    includeIgnored?: boolean;
    /** Stop after this many returned entries have been collected. */
    maxEntries?: number;
}
export interface GlobOptions {
    cwd?: ResolvedPath;
    includeIgnored?: boolean;
    maxResults?: number;
}
export type ContentHash = `sha256:${string}`;
export interface ReadBytesOptions {
    /** Zero-based byte offset. */
    offset?: number;
    /** Maximum bytes to return; defaults to MAX_READ_BYTES. */
    maxBytes?: number;
}
export interface ReadBytesOutcome {
    buffer: Buffer;
    sizeBytes: number;
    returnedBytes: number;
    offset: number;
    truncated: boolean;
    /** Present only when the returned window covers the whole file. */
    hash?: ContentHash;
}
export type WriteMode = 'create' | 'replace';
export interface WriteTextAtomicOptions extends WriteTextFileOptions {
    mode: WriteMode;
    expectedHash?: ContentHash;
    lineEnding?: 'crlf' | 'lf';
}
export interface WriteTextAtomicOutcome {
    created: boolean;
    sizeBytes: number;
    hash: ContentHash;
    meta: ReadMeta;
}
export interface WriteOutcome {
    writtenBytes: number;
    hash?: ContentHash;
    meta?: ReadMeta;
}
export interface RequestContext extends AuditContext {
    /** Mostly redundant with `originatorClientId`; kept for forward-compat with future ACP fields. */
    ownerSessionId?: string;
}
/**
 * Public boundary type. PR 19/20 routes consume this via the
 * factory's `forRequest(ctx)` so audit context is automatically
 * threaded through every operation.
 */
export interface WorkspaceFileSystem {
    resolve(input: string, intent: Intent): Promise<ResolvedPath>;
    stat(p: ResolvedPath): Promise<FsStat>;
    readText(p: ResolvedPath, opts?: ReadTextOptions): Promise<{
        content: string;
        meta: ReadMeta;
    }>;
    readBytes(p: ResolvedPath, opts?: ReadBytesOptions): Promise<Buffer>;
    readBytesWindow(p: ResolvedPath, opts?: ReadBytesOptions): Promise<ReadBytesOutcome>;
    list(p: ResolvedPath, opts?: ListOptions): Promise<FsEntry[]>;
    glob(pattern: string, opts?: GlobOptions): Promise<ResolvedPath[]>;
    writeTextAtomic(p: ResolvedPath, content: string, opts: WriteTextAtomicOptions): Promise<WriteTextAtomicOutcome>;
    writeText(p: ResolvedPath, content: string, opts?: WriteTextFileOptions): Promise<void>;
    edit(p: ResolvedPath, oldText: string, newText: string, opts?: {
        expectedHash?: ContentHash;
    }): Promise<WriteOutcome>;
    editAtomic(p: ResolvedPath, oldText: string, newText: string, opts: {
        expectedHash: ContentHash;
    }): Promise<WriteOutcome>;
}
/**
 * Per-process factory. Build once at `createServeApp` boot, call
 * `forRequest` per HTTP route invocation.
 */
export interface WorkspaceFileSystemFactory {
    forRequest(ctx: RequestContext): WorkspaceFileSystem;
}
export interface CreateWorkspaceFileSystemFactoryDeps {
    /** Canonical workspace path; the daemon's `boundWorkspace`. */
    boundWorkspace: string;
    /** Snapshot of `Config.isTrustedFolder()` at boot. */
    trusted: boolean;
    /** Bridge-bound publisher into `EventBus.publish`. */
    emit: (event: BridgeEvent) => void;
    /**
     * Override the default ignore loader. Tests pass a fixed `Ignore`
     * to avoid filesystem coupling; production lets the factory build
     * one per workspace via `loadIgnoreRules`.
     */
    ignore?: Ignore;
    /** Override audit raw-path mode. Defaults to env `QWEN_AUDIT_RAW_PATHS=1`. */
    includeRawPaths?: boolean;
}
/**
 * Build a `WorkspaceFileSystemFactory`. The factory itself is
 * stateless across requests; per-request state (the audit context)
 * lives on the bound `WorkspaceFileSystem` returned from `forRequest`.
 */
export declare function createWorkspaceFileSystemFactory(deps: CreateWorkspaceFileSystemFactoryDeps): WorkspaceFileSystemFactory;
export declare function isContentHash(value: unknown): value is ContentHash;
export { MAX_READ_BYTES };
