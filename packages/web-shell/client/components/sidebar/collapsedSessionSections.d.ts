/**
 * Shared localStorage helpers for Web Shell session-organization collapse
 * state. Primary sidebar and per-workspace sections both write into one app
 * key so preferences survive reload without competing overwrites.
 *
 * Id conventions:
 * - Primary catalog: `group:<id>`, `recent`, `color:<name>`, `channel-type:<type>`
 * - Workspace-scoped: `ws:<workspaceId>|group:<id>`, `ws:<workspaceId>|ungrouped`
 */
export declare const COLLAPSED_SESSION_SECTIONS_STORAGE_KEY = "qwen-code-web-shell-collapsed-session-groups";
export declare function isPrimaryCollapsedSectionId(id: string): boolean;
export declare function workspaceGroupSectionId(workspaceId: string, groupId: string): string;
export declare function workspaceUngroupedSectionId(workspaceId: string): string;
export declare function isWorkspaceCollapsedSectionId(workspaceId: string, id: string): boolean;
export declare function readCollapsedSessionSectionIds(): Set<string>;
export declare function writeCollapsedSessionSectionIds(ids: ReadonlySet<string>): void;
/**
 * Replace one owner's subset of collapsed ids while preserving other owners
 * (primary vs per-workspace), so parallel writers do not clobber each other.
 */
export declare function replaceOwnedCollapsedSessionSectionIds(ownedIds: ReadonlySet<string>, isOwned: (id: string) => boolean): void;
export declare function readWorkspaceCollapsedGroupIds(workspaceId: string): Set<string>;
export declare function writeWorkspaceCollapsedGroupIds(workspaceId: string, localIds: ReadonlySet<string>): void;
