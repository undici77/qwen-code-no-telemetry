/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type {
  RebuiltSessionArtifactSnapshot,
  SessionArtifactEventRecordPayload,
  SessionArtifactPersistenceWarning,
  SessionArtifactRestoreState,
  SessionArtifactRetention,
  SessionArtifactSnapshotRecordPayload,
} from '@qwen-code/qwen-code-core';
export type DaemonSessionArtifactKind =
  | 'file'
  | 'link'
  | 'html'
  | 'image'
  | 'video'
  | 'audio'
  | 'pdf'
  | 'notebook'
  | 'other';
export type DaemonSessionArtifactStorage =
  | 'workspace'
  | 'external_url'
  | 'managed'
  | 'published';
export type DaemonSessionArtifactSource = 'tool' | 'hook' | 'client';
export type DaemonSessionArtifactStatus = 'available' | 'missing' | 'changed';
export type DaemonSessionArtifactRetention = Exclude<
  SessionArtifactRetention,
  'pinned'
>;
export declare function isArtifactRestoreFailureWarning(
  warning: string,
): boolean;
export interface ToolArtifactLike {
  kind?: DaemonSessionArtifactKind;
  storage?: DaemonSessionArtifactStorage;
  title: string;
  description?: string;
  workspacePath?: string;
  managedId?: string;
  url?: string;
  mimeType?: string;
  sizeBytes?: number;
  metadata?: Record<string, string | number | boolean | null>;
}
export interface SessionArtifactInput extends ToolArtifactLike {
  source?: DaemonSessionArtifactSource;
  retention?: DaemonSessionArtifactRetention;
  clientRetained?: boolean;
  toolCallId?: string;
  toolName?: string;
  hookEventName?: string;
  clientId?: string;
}
export interface DaemonSessionArtifact {
  id: string;
  kind: DaemonSessionArtifactKind;
  storage: DaemonSessionArtifactStorage;
  source: DaemonSessionArtifactSource;
  status: DaemonSessionArtifactStatus;
  title: string;
  description?: string;
  workspacePath?: string;
  managedId?: string;
  url?: string;
  mimeType?: string;
  sizeBytes?: number;
  metadata?: Record<string, string | number | boolean | null>;
  retention: DaemonSessionArtifactRetention;
  restoreState?: SessionArtifactRestoreState;
  persistenceWarning?: SessionArtifactPersistenceWarning;
  persistedAt?: string;
  clientRetained: boolean;
  createdAt: string;
  updatedAt: string;
  toolCallId?: string;
  toolName?: string;
  hookEventName?: string;
  clientId?: string;
}
export type SessionArtifactRemovalReason =
  | 'eviction'
  | 'explicit'
  | 'unpin_to_ephemeral';
export interface SessionArtifactChange {
  action: 'created' | 'updated' | 'removed';
  artifactId: string;
  artifact?: DaemonSessionArtifact;
  reason?: SessionArtifactRemovalReason;
  durableTombstoneRequired?: boolean;
}
export interface SessionArtifactsEnvelope {
  v: 1;
  sessionId: string;
  artifacts: DaemonSessionArtifact[];
  generatedAt: string;
  limits: {
    maxArtifacts: number;
  };
  warnings?: string[];
  warningDetails?: SessionArtifactWarningDetail[];
}
export interface SessionArtifactMutationResult {
  v: 1;
  sessionId: string;
  changes: SessionArtifactChange[];
  warnings?: string[];
  warningDetails?: SessionArtifactWarningDetail[];
}
export interface SessionArtifactWarningDetail {
  code: string;
  operation: 'upsert' | 'remove' | 'restore';
  artifactIds?: string[];
  durability?: 'durable' | 'live_only' | 'unavailable';
  retryable?: boolean;
  message: string;
}
export interface SessionArtifactRestoreOptions {
  preserveLiveEphemeral?: boolean;
}
export interface SessionArtifactPersistence {
  recordEvent(payload: SessionArtifactEventRecordPayload): Promise<void>;
  recordSnapshot(payload: SessionArtifactSnapshotRecordPayload): Promise<void>;
}
export declare class SessionArtifactValidationError extends Error {
  readonly field?: string | undefined;
  readonly code = 'VALIDATION_FAILED';
  constructor(message: string, field?: string | undefined);
}
export declare class SessionArtifactAuthorizationError extends Error {
  readonly sessionId: string;
  readonly artifactId: string;
  readonly ownerClientId: string;
  readonly requesterClientId?: string | undefined;
  readonly code = 'SESSION_ARTIFACT_FORBIDDEN';
  constructor(
    sessionId: string,
    artifactId: string,
    ownerClientId: string,
    requesterClientId?: string | undefined,
  );
}
interface SessionArtifactStoreOptions {
  sessionId: string;
  workspaceCwd: string;
  maxArtifacts?: number;
  persistence?: SessionArtifactPersistence;
}
export declare class SessionArtifactStore {
  private readonly sessionId;
  private readonly workspaceCwd;
  private readonly maxArtifacts;
  private readonly persistence?;
  private readonly artifacts;
  private receivedSeq;
  private insertSeq;
  private persistenceSeq;
  private durableEventsSinceSnapshot;
  private consecutiveSnapshotFailures;
  private realWorkspaceCwdPromise?;
  private operationQueue;
  private readonly tombstonedIds;
  private readonly tombstonedClientIds;
  private readonly stickyEphemeralIds;
  private readonly markerArtifacts;
  private lastRestoreWarnings;
  private lastRestoreWarningDetails;
  constructor(options: SessionArtifactStoreOptions);
  inputBatchLimit(): number;
  list(): Promise<SessionArtifactsEnvelope>;
  get(artifactId: string): Promise<DaemonSessionArtifact | undefined>;
  upsertMany(
    inputs: SessionArtifactInput[],
    options?: {
      strict?: boolean;
      validationStrict?: boolean;
      persistenceStrict?: boolean;
      trustedPublisher?: boolean;
    },
  ): Promise<SessionArtifactMutationResult>;
  private findPublishedUpgradeTarget;
  private findPublishedWorkspaceTarget;
  remove(
    artifactId: string,
    options?: {
      clientId?: string;
    },
  ): Promise<SessionArtifactMutationResult>;
  restore(
    snapshot: RebuiltSessionArtifactSnapshot | undefined,
    options?: SessionArtifactRestoreOptions,
  ): Promise<string[]>;
  recordSnapshot(): Promise<string[]>;
  private normalizeRestoredMarkerArtifact;
  private cloneState;
  private restoreState;
  private persistChanges;
  private maybeRecordSnapshot;
  private buildSnapshotPayload;
  private buildMarkerArtifacts;
  private downgradeDurableChanges;
  private applyDurableMarkers;
  private rememberStickyEphemeral;
  private rememberTombstone;
  private setLastRestoreWarnings;
  private enqueue;
  private denyCrossClientMutation;
  private normalizeInput;
  private shouldSuppressTombstonedUpsert;
  private refreshWorkspaceStatuses;
  private applyStickyEphemeralOverride;
  private getInitialWorkspaceStatus;
  private refreshWorkspaceStatus;
  private getRealWorkspaceCwd;
  private getRealWorkspaceCwdForValidation;
  private evictOverflow;
}
export declare function publicArtifactsEqual(
  a: DaemonSessionArtifact,
  b: DaemonSessionArtifact,
): boolean;
export {};
