/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { WorkspaceRuntimeProvenance } from './managed-scratch-workspace.js';
import type { ServeChannelSelection } from './types.js';
/**
 * A registered workspace runtime, reduced to the fields channel grouping needs.
 */
export interface ChannelWorkspaceInput {
    /** Canonical workspace cwd (as registered on the daemon). */
    readonly workspaceCwd: string;
    readonly primary: boolean;
    readonly trusted: boolean;
    readonly provenance?: WorkspaceRuntimeProvenance;
}
/** A channel selection scoped to a single owning workspace. */
export interface ChannelWorkspaceGroup {
    readonly workspaceCwd: string;
    readonly selection: ServeChannelSelection;
}
export type ChannelWorkspaceGroupingErrorCode = 'channel_workspace_mismatch' | 'ambiguous_channel_workspace' | 'untrusted_workspace' | 'no_primary_workspace';
export interface ChannelWorkspaceGroupingError {
    readonly code: ChannelWorkspaceGroupingErrorCode;
    readonly message: string;
    readonly channel?: string;
}
export type ChannelWorkspaceGroupingResult = {
    readonly ok: true;
    readonly groups: readonly ChannelWorkspaceGroup[];
} | {
    readonly ok: false;
    readonly error: ChannelWorkspaceGroupingError;
};
export interface ResolveChannelWorkspaceGroupsInput {
    readonly workspaces: readonly ChannelWorkspaceInput[];
    readonly selection: ServeChannelSelection;
    /**
     * Returns a workspace's merged channel config map (`settings.merged.channels`
     * style). Injected so the resolver stays pure and unit-testable.
     */
    readonly loadChannelsConfig: (workspaceCwd: string) => Record<string, unknown>;
}
/**
 * Resolve the workspace a channel's configured cwd belongs to. Relative paths
 * resolve against the owning workspace via `resolveChannelCwd`, then use the
 * worker-side `validateChannelWorkspaces` canonicalization so the serve-layer
 * grouping and the worker's own validation always agree.
 */
export declare function resolveChannelOwnerCwd(rawCwd: string | undefined, workspaceCwd: string): string;
/**
 * Group a `--channel` selection by the registered workspace that owns each
 * channel. A channel belongs to workspace `W` iff its resolved cwd
 * (`explicit || W`) canonicalizes back to `W` — i.e. it would pass the
 * worker's `validateChannelWorkspaces` under `W`. Because `loadChannelsConfig`
 * reads merged settings (system + user + workspace scopes), a user/system-scope
 * channel with no `cwd` matches every workspace and is reported as ambiguous.
 *
 * `--channel all` stays primary-only in v1 to avoid implicit cross-workspace
 * process fan-out.
 */
export declare function resolveChannelWorkspaceGroups(input: ResolveChannelWorkspaceGroupsInput): ChannelWorkspaceGroupingResult;
