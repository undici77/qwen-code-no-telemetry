/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { canonicalizeWorkspace } from '@qwen-code/acp-bridge/workspacePaths';
import { resolveChannelCwd } from '../commands/channel/channel-cwd.js';
/**
 * Resolve the workspace a channel's configured cwd belongs to. Relative paths
 * resolve against the owning workspace via `resolveChannelCwd`, then use the
 * worker-side `validateChannelWorkspaces` canonicalization so the serve-layer
 * grouping and the worker's own validation always agree.
 */
export function resolveChannelOwnerCwd(rawCwd, workspaceCwd) {
    return canonicalizeWorkspace(resolveChannelCwd(rawCwd, workspaceCwd));
}
function rawChannelCwd(entry) {
    if (!entry || typeof entry !== 'object')
        return undefined;
    const cwd = entry.cwd;
    return typeof cwd === 'string' && cwd.length > 0 ? cwd : undefined;
}
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
export function resolveChannelWorkspaceGroups(input) {
    const { selection, loadChannelsConfig } = input;
    const workspaces = input.workspaces.filter((workspace) => workspace.provenance !== 'live-conversation');
    const primary = workspaces.find((workspace) => workspace.primary);
    if (!primary) {
        return {
            ok: false,
            error: {
                code: 'no_primary_workspace',
                message: 'No primary workspace is registered.',
            },
        };
    }
    if (selection.mode === 'all') {
        if (!primary.trusted) {
            return {
                ok: false,
                error: {
                    code: 'untrusted_workspace',
                    message: `Primary workspace "${primary.workspaceCwd}" is not trusted; cannot host channels.`,
                },
            };
        }
        return {
            ok: true,
            groups: [
                { workspaceCwd: primary.workspaceCwd, selection: { mode: 'all' } },
            ],
        };
    }
    // Load each workspace's merged channel config once, rather than once per
    // selected channel name.
    const channelsConfigByWorkspace = new Map();
    for (const workspace of workspaces) {
        channelsConfigByWorkspace.set(workspace.workspaceCwd, loadChannelsConfig(workspace.workspaceCwd));
    }
    const namesByWorkspace = new Map();
    for (const name of selection.names) {
        const owners = [];
        for (const workspace of workspaces) {
            const entry = (channelsConfigByWorkspace.get(workspace.workspaceCwd) ??
                {})[name];
            if (!entry || typeof entry !== 'object')
                continue;
            let ownerCwd;
            try {
                ownerCwd = resolveChannelOwnerCwd(rawChannelCwd(entry), workspace.workspaceCwd);
            }
            catch {
                // A configured cwd that cannot be canonicalized (e.g. EACCES) cannot
                // own the channel; treat this workspace as a non-owner. If no
                // workspace matches, the channel falls through to the 0-owner
                // mismatch error below.
                continue;
            }
            if (ownerCwd === workspace.workspaceCwd) {
                owners.push(workspace);
            }
        }
        if (owners.length === 0) {
            return {
                ok: false,
                error: {
                    code: 'channel_workspace_mismatch',
                    channel: name,
                    message: `Channel "${name}" is not configured in any registered workspace, or its "cwd" points outside them.`,
                },
            };
        }
        if (owners.length > 1) {
            return {
                ok: false,
                error: {
                    code: 'ambiguous_channel_workspace',
                    channel: name,
                    message: `Channel "${name}" is configured in multiple registered workspaces (${owners
                        .map((owner) => owner.workspaceCwd)
                        .join(', ')}). Define it in one workspace's settings or set an explicit "cwd".`,
                },
            };
        }
        const owner = owners[0];
        if (!owner.trusted) {
            return {
                ok: false,
                error: {
                    code: 'untrusted_workspace',
                    channel: name,
                    message: `Channel "${name}" targets untrusted workspace "${owner.workspaceCwd}".`,
                },
            };
        }
        const names = namesByWorkspace.get(owner.workspaceCwd) ?? [];
        names.push(name);
        namesByWorkspace.set(owner.workspaceCwd, names);
    }
    return {
        ok: true,
        groups: [...namesByWorkspace.entries()].map(([workspaceCwd, names]) => ({
            workspaceCwd,
            selection: { mode: 'names', names },
        })),
    };
}
//# sourceMappingURL=channel-workspace-grouping.js.map