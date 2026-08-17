/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import {
  type Ignore,
  type WriteTextFileOptions,
} from '@qwen-code/qwen-code-core';
import type { BridgeEvent } from '@qwen-code/acp-bridge/eventBus';
import type { WorkspaceGenerationGuard } from '../workspace-registry.js';
import { type AuditContext } from './audit.js';
import { type Intent, type ResolvedPath } from './paths.js';
import { MAX_READ_BYTES } from './policy.js';
import { PathMutexRegistry } from './path-mutex-registry.js';
/**
 * Stat snapshot returned by `WorkspaceFileSystem.stat`. We
 * deliberately avoid passing through `fs.Stats` directly — the
 * boundary should not leak Node-specific bigint quirks or
 * platform-specific fields to SDK consumers.
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
  /**
   * Resume token for the next page. Present only when content remains *and* a
   * file byte offset is derivable — a non-UTF-8 snapshot read has more to give
   * but cannot be paged by byte, which is why `hasMore` is a separate field
   * rather than a restatement of this one.
   */
  nextCursor?: string;
  /** Whether content remains beyond what was returned, for any reason. */
  hasMore?: boolean;
}
/**
 * Above `MAX_READ_BYTES` at least one of these must be set. Any of them is
 * the caller stating it accepts partial content, which is all the streamed
 * path returns; with none of them the read is refused rather than silently
 * handing back a truncated "whole file". Which one is set does not affect
 * cost — that is bounded by `MAX_TEXT_SCAN_BYTES`.
 */
export interface ReadTextOptions {
  /** Returned-byte cap in [1, MAX_READ_BYTES]; defaults to MAX_READ_BYTES. */
  maxBytes?: number;
  /**
   * Opaque resume token from a previous read's `meta.nextCursor`. Mutually
   * exclusive with `line` — both name a starting point. Reaches any offset in
   * O(1), where `line` must scan from byte 0.
   */
  cursor?: string;
  /**
   * 1-based starting line for partial reads. `1` returns the file
   * from its first line. The boundary converts to the 0-based slice
   * index `readFileWithLineAndLimit` expects internally; SDK
   * consumers don't need to adjust. Undefined starts from the
   * beginning; non-positive or non-integral values are rejected.
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
/**
 * Atomic write modes.
 *
 *   - `'create'`   — fails with `file_already_exists` if the target exists.
 *   - `'replace'`  — requires `expectedHash`; fails with `hash_mismatch` if
 *                    the on-disk hash doesn't match (optimistic concurrency).
 *   - `'overwrite'` — unconditional create-or-overwrite, no hash check. Used
 *                     by callers whose protocol has no client-side hash
 *                     (e.g. ACP `WriteTextFileRequest` has only
 *                     `{path, content, sessionId}`). Still goes through the
 *                     atomic tmp+rename + mode-preservation path so a
 *                     `0o600` secret edit does NOT downgrade to umask-default
 *                     and a SIGKILL mid-write does NOT truncate the target.
 */
export type WriteMode = 'create' | 'replace' | 'overwrite';
/**
 * Subset of `WriteMode` that `writeTextAtomic` accepts. `'overwrite'`
 * is intentionally excluded: the helper underneath
 * (`atomicWriteTextResolvedFile`) supports it for the `writeTextOverwrite`
 * method, but `writeTextAtomic`'s `existingMeta`-detection +
 * `created`-derivation branches assume 'create' | 'replace' shape.
 * Narrowing here prevents callers from writing
 * `writeTextAtomic(p, c, {mode: 'overwrite'})` and hitting the runtime
 * `parse_error` from `validateWriteTextAtomicOptions` — TypeScript
 * catches it at compile time and points at the right alternative
 * (`writeTextOverwrite`).
 */
export type AtomicWriteMode = Exclude<WriteMode, 'overwrite'>;
export interface WriteTextAtomicOptions extends WriteTextFileOptions {
  mode: AtomicWriteMode;
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
/** Host-only write input after the bridge adapter validates tool provenance. */
export interface SameHostToolTextWriteRequest {
  path: string;
  content: string;
  meta?: {
    bom?: boolean;
    encoding?: string;
    lineEnding?: 'crlf' | 'lf';
  };
}
/**
 * Public boundary type. Routes consume this via the
 * factory's `forRequest(ctx)` so audit context is automatically
 * threaded through every operation.
 */
export interface WorkspaceFileSystem {
  resolve(input: string, intent: Intent): Promise<ResolvedPath>;
  stat(p: ResolvedPath): Promise<FsStat>;
  readText(
    p: ResolvedPath,
    opts?: ReadTextOptions,
  ): Promise<{
    content: string;
    meta: ReadMeta;
  }>;
  readBytes(p: ResolvedPath, opts?: ReadBytesOptions): Promise<Buffer>;
  readBytesWindow(
    p: ResolvedPath,
    opts?: ReadBytesOptions,
  ): Promise<ReadBytesOutcome>;
  list(p: ResolvedPath, opts?: ListOptions): Promise<FsEntry[]>;
  glob(pattern: string, opts?: GlobOptions): Promise<ResolvedPath[]>;
  writeTextAtomic(
    p: ResolvedPath,
    content: string,
    opts: WriteTextAtomicOptions,
  ): Promise<WriteTextAtomicOutcome>;
  /**
   * Unconditional create-or-overwrite (no `expectedHash` gate). Atomic
   * temp+rename with target-mode preservation: a `0o600` secret survives
   * the edit at `0o600`; a new file is created at `0o600` (NOT umask
   * default). Used by protocols whose wire format carries no client-side
   * hash — e.g. ACP `WriteTextFileRequest` is just `{path, content,
   * sessionId}` so the CAS-gated `writeTextAtomic` doesn't fit.
   *
   * Symlinks at the target are rejected (`symlink_escape`) consistent
   * with `writeTextAtomic` and HTTP `POST /file`.
   */
  writeTextOverwrite(
    p: ResolvedPath,
    content: string,
    opts?: WriteTextFileOptions,
  ): Promise<WriteTextAtomicOutcome>;
  writeText(
    p: ResolvedPath,
    content: string,
    opts?: WriteTextFileOptions,
  ): Promise<void>;
  edit(
    p: ResolvedPath,
    oldText: string,
    newText: string,
    opts?: {
      expectedHash?: ContentHash;
    },
  ): Promise<WriteOutcome>;
  editAtomic(
    p: ResolvedPath,
    oldText: string,
    newText: string,
    opts: {
      expectedHash: ContentHash;
    },
  ): Promise<WriteOutcome>;
  /**
   * Single-purpose no-clobber binary create. Writes `data` atomically
   * (temp + publish) at `p`; it cannot modify or replace existing file
   * content. An existing target (including a final-component symlink)
   * throws `file_already_exists` (`symlink_escape` for a symlink). The
   * caller is responsible for choosing a free name; the upload route owns
   * the numbered-candidate policy; the collision is expected control flow
   * there and emits no `fs.denied` audit event. `data` is size-checked
   * against `MAX_UPLOAD_BYTES` here — the binary-ingress policy, NOT the
   * `MAX_WRITE_BYTES` text default. Trust and generation guards are enforced
   * at entry, inside the path lock, and at the final publish checkpoint.
   * New files are created at `0o600`.
   */
  writeBytesAtomic(
    p: ResolvedPath,
    data: Buffer,
  ): Promise<{
    sizeBytes: number;
    hash: ContentHash;
  }>;
}
/**
 * Per-process factory. Build once at `createServeApp` boot, call
 * `forRequest` per HTTP route invocation.
 */
export interface WorkspaceFileSystemFactory {
  forRequest(ctx: RequestContext): WorkspaceFileSystem;
  assertCanWrite(): void;
  /** Optional so existing custom factories remain workspace-only by default. */
  writeSameHostToolText?(
    ctx: RequestContext,
    request: SameHostToolTextWriteRequest,
  ): Promise<void>;
}
export interface CreateWorkspaceFileSystemFactoryDeps {
  /** Canonical workspace roots; index 0 is the primary cwd. */
  boundWorkspaces: readonly string[];
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
  /** Custom AI ignore files from context.fileFiltering.customIgnoreFiles. */
  customIgnoreFiles?: string[];
  /** Optional shared write-lock registry for multiple daemon entrypoints. */
  pathLocks?: PathMutexRegistry;
  /** Runtime-generation guard checked at mutation commit points. */
  generationGuard?: Pick<WorkspaceGenerationGuard, 'assertOpen'>;
}
/**
 * Build a `WorkspaceFileSystemFactory`. The factory itself is
 * stateless across requests; per-request state (the audit context)
 * lives on the bound `WorkspaceFileSystem` returned from `forRequest`.
 */
export declare function createWorkspaceFileSystemFactory(
  deps: CreateWorkspaceFileSystemFactoryDeps,
): WorkspaceFileSystemFactory;
export declare function isContentHash(value: unknown): value is ContentHash;
export { MAX_READ_BYTES };
