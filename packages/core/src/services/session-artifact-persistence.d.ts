/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export declare const SESSION_ARTIFACT_PERSISTENCE_VERSION: 2;
export declare const WORKSPACE_CONTENT_SHA256_METADATA_KEY = "qwen.workspace.sha256";
export declare const WORKSPACE_CONTENT_MTIME_MS_METADATA_KEY = "qwen.workspace.mtimeMs";
export type SessionArtifactRetention = 'ephemeral' | 'restorable' | 'pinned';
export type SessionArtifactRestoreState = 'live' | 'restored' | 'unverified' | 'blocked';
export type SessionArtifactPersistenceWarning = 'persistence_unavailable' | 'metadata_only_restore' | 'restore_validation_failed' | 'sticky_override_active';
export type PersistedSessionArtifactKind = 'file' | 'link' | 'html' | 'image' | 'video' | 'audio' | 'pdf' | 'notebook' | 'other';
export type PersistedSessionArtifactStorage = 'workspace' | 'external_url' | 'managed' | 'published';
export type PersistedSessionArtifactSource = 'tool' | 'hook' | 'client';
export type PersistedSessionArtifactStatus = 'available' | 'missing' | 'changed';
export interface SessionArtifactContentRef {
    kind: 'managed_copy';
    contentId: string;
    sha256: string;
    sizeBytes: number;
    createdAt: string;
}
export interface PersistedSessionArtifact {
    id: string;
    kind: PersistedSessionArtifactKind;
    storage: PersistedSessionArtifactStorage;
    source: PersistedSessionArtifactSource;
    status: PersistedSessionArtifactStatus;
    title: string;
    description?: string;
    workspacePath?: string;
    managedId?: string;
    url?: string;
    mimeType?: string;
    sizeBytes?: number;
    metadata?: Record<string, string | number | boolean | null>;
    retention: SessionArtifactRetention;
    clientRetained: boolean;
    createdAt: string;
    updatedAt: string;
    persistedAt?: string;
    expiresAt?: string;
    contentRef?: SessionArtifactContentRef;
    toolCallId?: string;
    toolName?: string;
    hookEventName?: string;
    clientId?: string;
}
export type SessionArtifactPersistedChangeAction = 'created' | 'updated' | 'removed';
export type SessionArtifactPersistedRemovalReason = 'explicit' | 'eviction' | 'unpin_to_ephemeral';
export interface SessionArtifactPersistedChange {
    action: SessionArtifactPersistedChangeAction;
    artifactId: string;
    artifact?: PersistedSessionArtifact;
    reason?: SessionArtifactPersistedRemovalReason;
}
export interface SessionArtifactEventRecordPayload {
    v: typeof SESSION_ARTIFACT_PERSISTENCE_VERSION;
    sessionId: string;
    sequence: number;
    recordedAt: string;
    changes: SessionArtifactPersistedChange[];
}
export interface SessionArtifactSnapshotRecordPayload {
    v: typeof SESSION_ARTIFACT_PERSISTENCE_VERSION;
    sessionId: string;
    sequence: number;
    recordedAt: string;
    artifacts: PersistedSessionArtifact[];
    tombstonedIds?: string[];
    stickyEphemeralIds?: string[];
    markerArtifacts?: PersistedSessionArtifact[];
}
export interface RebuiltSessionArtifactSnapshot {
    v: typeof SESSION_ARTIFACT_PERSISTENCE_VERSION;
    sessionId: string;
    sequence: number;
    artifacts: PersistedSessionArtifact[];
    tombstonedIds: string[];
    stickyEphemeralIds: string[];
    markerArtifacts?: PersistedSessionArtifact[];
    warnings: string[];
}
export interface SessionArtifactChatRecordLike {
    type?: unknown;
    subtype?: unknown;
    sessionId?: unknown;
    systemPayload?: unknown;
}
export declare function isSessionArtifactRecord(record: SessionArtifactChatRecordLike): boolean;
export declare function stableSessionArtifactId(sessionId: string, identityKey: string): string;
export declare function sessionArtifactIdentityKey(artifact: Pick<PersistedSessionArtifact, 'workspacePath' | 'managedId' | 'url'>): string | undefined;
export declare function rebuildSessionArtifactSnapshot(records: readonly SessionArtifactChatRecordLike[], fallbackSessionId?: string): RebuiltSessionArtifactSnapshot | undefined;
export declare function remapSessionArtifactPayloadForFork(payload: unknown, sourceSessionId: string, newSessionId: string, remappedArtifactIds?: Map<string, string>): unknown;
export declare function normalizeSnapshotPayload(value: unknown, warnings: string[]): SessionArtifactSnapshotRecordPayload | undefined;
export declare function normalizeEventPayload(value: unknown, warnings: string[]): SessionArtifactEventRecordPayload | undefined;
export declare function isPrototypeMetadataKey(key: string): boolean;
export declare function isReservedWorkspaceMetadataKey(key: string): boolean;
export declare function metadataBudgetBytes(metadata: Record<string, string | number | boolean | null>, budget?: 'user' | 'persisted'): number;
export declare function isWorkspaceContentMetadataEntry(key: string, value: string | number | boolean | null): boolean;
