/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export type SessionWriterProcessKind =
  | 'interactive'
  | 'acp'
  | 'daemon'
  | 'unknown';
export type SessionWriterErrorKind =
  | 'session_writer_conflict'
  | 'session_writer_lost'
  | 'session_transcript_changed'
  | 'session_writer_unavailable';
export declare abstract class SessionWriterError extends Error {
  abstract readonly rpcCode: number;
  abstract readonly errorKind: SessionWriterErrorKind;
  abstract readonly httpStatus: 409 | 503;
}
export declare const SESSION_WRITER_RPC_CODES: {
  readonly session_writer_conflict: -32020;
  readonly session_writer_lost: -32021;
  readonly session_transcript_changed: -32022;
  readonly session_writer_unavailable: -32023;
};
export declare class SessionWriterConflictError extends SessionWriterError {
  readonly name = 'SessionWriterConflictError';
  readonly rpcCode: -32020;
  readonly errorKind = 'session_writer_conflict';
  readonly httpStatus = 409;
  constructor();
}
export declare class SessionWriterLostError extends SessionWriterError {
  readonly name = 'SessionWriterLostError';
  readonly rpcCode: -32021;
  readonly errorKind = 'session_writer_lost';
  readonly httpStatus = 409;
  constructor();
}
export declare class SessionTranscriptChangedError extends SessionWriterError {
  readonly name = 'SessionTranscriptChangedError';
  readonly rpcCode: -32022;
  readonly errorKind = 'session_transcript_changed';
  readonly httpStatus = 409;
  constructor();
}
export declare class SessionWriterUnavailableError extends SessionWriterError {
  readonly name: string;
  readonly rpcCode: -32023;
  readonly errorKind = 'session_writer_unavailable';
  readonly httpStatus = 503;
  constructor(
    options?: ErrorOptions & {
      message?: string;
    },
  );
}
export declare class SessionTranscriptIdentityUnavailableError extends SessionWriterUnavailableError {
  readonly name = 'SessionTranscriptIdentityUnavailableError';
  constructor(cause?: Error);
}
export interface AcquireSessionWriterLeaseOptions {
  runtimeBaseDir: string;
  sessionId: string;
  transcriptPath: string;
  processKind?: SessionWriterProcessKind;
  qwenVersion?: string | null;
  reclaimPolicy?: 'local' | 'never';
  takeoverPolicy?: 'never' | 'certified';
  onOwnershipAcquired?: (lease: SessionWriterLease) => void;
}
export declare function getSessionWriterLockPath(
  runtimeBaseDir: string,
  sessionId: string,
): string;
export declare class SessionWriterLease {
  private readonly lockPath;
  readonly ownerId: string;
  readonly sessionId: string;
  readonly runtimeBaseDir: string;
  readonly transcriptPath: string;
  private expectedTranscriptState;
  private expectedTranscriptHasher;
  private released;
  private terminalPromise;
  private operationTail;
  private readonly lockRecordRaw;
  private readonly retiredPath;
  private readonly claimPath;
  private constructor();
  get transcriptExistedAtAcquire(): boolean;
  static acquire(
    options: AcquireSessionWriterLeaseOptions,
  ): Promise<SessionWriterLease>;
  private static acquireInternal;
  private static takeOverSealed;
  private static finishAcquisition;
  private static inspectExistingLock;
  private readOwnedLock;
  assertOwnedAndUnchanged(): Promise<void>;
  private assertOwnedAndUnchangedOnce;
  appendJsonLine(value: unknown): Promise<void>;
  private appendJsonLineOnce;
  private reconcileTranscriptMetadata;
  release(): Promise<void>;
  sealForHandoff(): Promise<void>;
  get isReleased(): boolean;
  private runExclusive;
  private releaseOnce;
  private sealForHandoffOnce;
  private readOwnedLockForRelease;
  private inspectReleasePath;
}
