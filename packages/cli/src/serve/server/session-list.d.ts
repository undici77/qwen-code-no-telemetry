/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { type SessionArchiveState } from '@qwen-code/qwen-code-core';
import type { AcpSessionBridge, BridgeSessionSummary } from '../acp-session-bridge.js';
export interface ListWorkspaceSessionsOptions {
    cursor?: string;
    size?: number;
    archiveState?: SessionArchiveState;
    view?: 'organized';
    group?: string;
    /**
     * Restrict the result to sessions spawned by this parent (via
     * `create_sub_session`), matched exactly against each session's
     * `parentSessionId`. When set on the default (non-organized) path the whole
     * workspace is gathered and filtered before pagination, so a page is never
     * silently short of matches; the returned cursor is opaque and activity-based
     * (not the numeric storage cursor). Absent = no parent filter.
     */
    parentSessionId?: string;
    /** Restrict results to sessions created by this source type. */
    sourceType?: string;
    /** Further restrict `sourceType` matches to this source identifier. */
    sourceId?: string;
}
export interface ListWorkspaceSessionsResult {
    sessions: BridgeSessionSummary[];
    nextCursor?: string;
    liveMergeFailed?: boolean;
    truncated?: boolean;
}
/**
 * Aggregate session counts for `GET .../session-info`.
 *
 * `expensive` is always true: the persisted totals require a disk scan of
 * local JSONL files and must not be polled in a tight loop.
 */
export interface WorkspaceSessionInfoResult {
    active: number;
    archived: number;
    total: number;
    live?: number;
    expensive: true;
    /**
     * Stable machine-readable hint that this response came from a full disk
     * scan. Clients should refresh infrequently / on demand only.
     */
    cost: 'disk_scan';
    truncated?: boolean;
}
export interface ListWorkspaceSessionsReadOptions {
    /** Merge live bridge state into persisted summaries. */
    mergeLive?: boolean;
    /** Runtime root owned by the selected managed workspace. */
    runtimeBaseDir?: string;
    /** Aborts this caller's wait without cancelling other shared waiters. */
    signal?: AbortSignal;
}
export interface InvalidateWorkspaceSessionListCacheOptions {
    runtimeBaseDir: string;
    workspaceCwd: string;
    archiveStates: readonly SessionArchiveState[];
}
export declare function invalidateWorkspaceSessionListCache(options: InvalidateWorkspaceSessionListCacheOptions): void;
export declare class InvalidCursorError extends Error {
    constructor(cursor: string, kind?: 'numeric' | 'organized' | 'live' | 'parent' | 'metadata');
}
export declare function listWorkspaceSessionsForResponse(bridge: AcpSessionBridge, workspaceCwd: string, options?: ListWorkspaceSessionsOptions, readOptions?: ListWorkspaceSessionsReadOptions): Promise<ListWorkspaceSessionsResult>;
export declare function listLiveWorkspaceSessionsForResponse(bridge: AcpSessionBridge, workspaceCwd: string, options?: Pick<ListWorkspaceSessionsOptions, 'cursor' | 'size'>): ListWorkspaceSessionsResult;
/**
 * Scans local persisted session JSONL files for aggregate counts and merges
 * the current in-memory live count from the bridge.
 *
 * This is an O(n) disk walk. Callers (and HTTP clients) must treat it as an
 * infrequent / on-demand operator endpoint, not a polling source.
 */
export declare function getWorkspaceSessionInfoForResponse(bridge: AcpSessionBridge, workspaceCwd: string, options?: {
    includeLive?: boolean;
}): Promise<WorkspaceSessionInfoResult>;
export declare function parseSessionPageSizeQuery(raw: unknown): number | undefined;
