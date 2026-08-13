/**
 * Shared localStorage helpers for Web Shell session-organization collapse
 * state. Primary sidebar and per-workspace sections both write into one app
 * key so preferences survive reload without competing overwrites.
 *
 * Id conventions:
 * - Primary catalog: `group:<id>`, `recent`, `color:<name>`, `channel-type:<type>`
 * - Workspace-scoped: `ws:<workspaceId>|group:<id>`, `ws:<workspaceId>|ungrouped`
 */
export const COLLAPSED_SESSION_SECTIONS_STORAGE_KEY = 'qwen-code-web-shell-collapsed-session-groups';
const WORKSPACE_SECTION_PREFIX = 'ws:';
export function isPrimaryCollapsedSectionId(id) {
    return !id.startsWith(WORKSPACE_SECTION_PREFIX);
}
export function workspaceGroupSectionId(workspaceId, groupId) {
    return `${WORKSPACE_SECTION_PREFIX}${workspaceId}|group:${groupId}`;
}
export function workspaceUngroupedSectionId(workspaceId) {
    return `${WORKSPACE_SECTION_PREFIX}${workspaceId}|ungrouped`;
}
export function isWorkspaceCollapsedSectionId(workspaceId, id) {
    return id.startsWith(`${WORKSPACE_SECTION_PREFIX}${workspaceId}|`);
}
export function readCollapsedSessionSectionIds() {
    if (typeof window === 'undefined')
        return new Set();
    try {
        const raw = window.localStorage.getItem(COLLAPSED_SESSION_SECTIONS_STORAGE_KEY);
        if (!raw)
            return new Set();
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed))
            return new Set();
        return new Set(parsed.filter((item) => typeof item === 'string' && item.trim().length > 0));
    }
    catch {
        return new Set();
    }
}
export function writeCollapsedSessionSectionIds(ids) {
    try {
        window.localStorage.setItem(COLLAPSED_SESSION_SECTIONS_STORAGE_KEY, JSON.stringify(Array.from(ids).sort()));
    }
    catch {
        // localStorage can be unavailable in private or embedded contexts.
    }
}
/**
 * Replace one owner's subset of collapsed ids while preserving other owners
 * (primary vs per-workspace), so parallel writers do not clobber each other.
 */
export function replaceOwnedCollapsedSessionSectionIds(ownedIds, isOwned) {
    const stored = readCollapsedSessionSectionIds();
    const next = new Set(Array.from(stored).filter((id) => !isOwned(id)));
    for (const id of ownedIds)
        next.add(id);
    writeCollapsedSessionSectionIds(next);
}
export function readWorkspaceCollapsedGroupIds(workspaceId) {
    const stored = readCollapsedSessionSectionIds();
    const local = new Set();
    const groupPrefix = `${WORKSPACE_SECTION_PREFIX}${workspaceId}|group:`;
    const ungroupedId = workspaceUngroupedSectionId(workspaceId);
    for (const id of stored) {
        if (id === ungroupedId) {
            local.add('ungrouped');
        }
        else if (id.startsWith(groupPrefix)) {
            local.add(id.slice(groupPrefix.length));
        }
    }
    return local;
}
export function writeWorkspaceCollapsedGroupIds(workspaceId, localIds) {
    const owned = new Set();
    for (const id of localIds) {
        owned.add(id === 'ungrouped'
            ? workspaceUngroupedSectionId(workspaceId)
            : workspaceGroupSectionId(workspaceId, id));
    }
    replaceOwnedCollapsedSessionSectionIds(owned, (id) => isWorkspaceCollapsedSectionId(workspaceId, id));
}
//# sourceMappingURL=collapsedSessionSections.js.map