/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export declare const GROUP_COLOR_OPTIONS: readonly ["red", "orange", "yellow", "green", "blue", "purple"];
export type SessionGroupPresetColor = (typeof GROUP_COLOR_OPTIONS)[number];
/** Shape hint only; runtime validation below enforces exactly six Hex digits. */
export type SessionGroupHexColor = `#${string}`;
export type SessionGroupColor = SessionGroupPresetColor | SessionGroupHexColor;
export interface SessionGroup {
    id: string;
    name: string;
    color: SessionGroupColor;
    order: number;
    createdAt: string;
    updatedAt: string;
}
export interface SessionOrganization {
    groupId: string | null;
    /**
     * Quick color grouping tag. Independent of `groupId`: the UI treats the two
     * as mutually exclusive (a color is a lightweight, name-free bucket), but the
     * store only records whatever fields callers provide. Absent/unknown → null.
     */
    color?: SessionGroupPresetColor | null;
    pinnedAt?: string;
    updatedAt: string;
}
export interface SessionOrganizationView extends SessionOrganization {
    color: SessionGroupPresetColor | null;
    isPinned: boolean;
}
export interface SessionOrganizationSnapshot {
    groups: SessionGroup[];
    sessions: Map<string, SessionOrganizationView>;
}
export interface SessionGroupCatalog {
    groups: SessionGroup[];
    colorOptions: SessionGroupPresetColor[];
}
export interface CreateSessionGroupInput {
    name: string;
    color: SessionGroupColor;
}
export interface UpdateSessionGroupInput {
    name?: string;
    color?: SessionGroupColor;
    order?: number;
}
export interface UpdateSessionOrganizationInput {
    isPinned?: boolean;
    groupId?: string | null;
    color?: SessionGroupPresetColor | null;
}
export declare class SessionOrganizationError extends Error {
    readonly code: string;
    readonly field?: string | undefined;
    constructor(message: string, code: string, field?: string | undefined);
}
export declare class SessionOrganizationService {
    private readonly onWarning?;
    private readonly storage;
    private readFailed;
    constructor(cwd: string, onWarning?: ((message: string) => void) | undefined);
    getStorePath(): string;
    listGroups(): Promise<SessionGroupCatalog>;
    readSnapshot(): Promise<SessionOrganizationSnapshot>;
    createGroup(input: CreateSessionGroupInput): Promise<SessionGroup>;
    updateGroup(groupId: string, input: UpdateSessionGroupInput): Promise<SessionGroup>;
    deleteGroup(groupId: string): Promise<boolean>;
    updateSessionOrganization(sessionId: string, input: UpdateSessionOrganizationInput): Promise<SessionOrganizationView>;
    removeSession(sessionId: string): Promise<void>;
    removeSessions(sessionIds: string[]): Promise<void>;
    private withStoreLock;
    private readStore;
    private handleUnreadableStore;
    private writeStore;
    private assertGroupNameAvailable;
    private sortGroups;
    private normalizeSessionGroup;
    private dedupeGroups;
    private warnOrphanedGroupReference;
    private warnMalformedSessionEntry;
    private warnMalformedGroupEntry;
    private warnOnce;
}
