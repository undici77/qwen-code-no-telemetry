/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Last path segment of an absolute workspace cwd, for a compact per-workspace
 * label (e.g. `/home/me/projects/api` → `api`). Falls back to the full path when
 * it has no segments.
 */
export function workspaceBasename(cwd) {
    const parts = cwd.split(/[\\/]+/).filter(Boolean);
    return parts.at(-1) ?? cwd;
}
export function workspaceLabel(workspace) {
    return workspace.displayName?.trim() || workspaceBasename(workspace.cwd);
}
export function workspaceLabelForCwd(cwd, workspaces) {
    const workspace = workspaces?.find((entry) => entry.cwd === cwd);
    return workspace ? workspaceLabel(workspace) : workspaceBasename(cwd);
}
/**
 * True when the daemon advertises more than one registered workspace — i.e. the
 * multi-workspace session surfaces (per-workspace labels/tags) should show.
 * A single-workspace daemon omits `workspaces` (or lists just the primary), so
 * every workspace-scoped affordance stays hidden and the UI is unchanged.
 */
export function hasMultipleWorkspaces(capabilities) {
    return (capabilities?.workspaces?.length ?? 0) > 1;
}
/**
 * Whether a session belongs to a workspace other than the primary one. Both cwds
 * are daemon-canonicalized, so a raw string compare is correct. Returns false
 * when either cwd is unknown (treat as primary) so single-workspace never tags.
 */
export function isNonPrimaryWorkspaceSession(workspaceCwd, primaryCwd) {
    return !!workspaceCwd && !!primaryCwd && workspaceCwd !== primaryCwd;
}
/**
 * Merge the primary workspace's sessions with the sessions collected from other
 * workspaces into one list, keyed by `sessionId` (primary wins on the unlikely
 * id collision). Returns the primary list unchanged (same reference) when there
 * are no other-workspace sessions, so the single-workspace path is a no-op.
 */
export function mergeSessionsById(primary, others) {
    if (others.length === 0)
        return primary;
    const byId = new Map();
    for (const session of primary)
        byId.set(session.sessionId, session);
    for (const session of others) {
        if (!byId.has(session.sessionId))
            byId.set(session.sessionId, session);
    }
    return [...byId.values()];
}
//# sourceMappingURL=workspace.js.map