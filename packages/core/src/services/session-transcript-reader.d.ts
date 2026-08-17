/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { HistoryGap } from '../utils/conversation-chain.js';
import type { ChatRecord } from './chatRecordingService.js';
export declare const SESSION_TRANSCRIPT_DEFAULT_LIMIT = 100;
export declare const SESSION_TRANSCRIPT_MAX_LIMIT = 500;
export declare const SESSION_TRANSCRIPT_CURSOR_VERSION: 1;
export declare const SESSION_TRANSCRIPT_MAX_INDEX_BYTES: number;
export declare const SESSION_TRANSCRIPT_MAX_PAGE_BYTES: number;
export declare const SESSION_TRANSCRIPT_MAX_EXPANDED_PAGE_BYTES: number;
export declare class InvalidSessionTranscriptCursorError extends Error {
  constructor(message?: string);
}
export declare class SessionTranscriptSnapshotUnavailableError extends Error {
  constructor(sessionId: string);
}
export declare class SessionTranscriptTooLargeError extends Error {
  readonly sessionId: string;
  readonly snapshotSize: number;
  readonly maxBytes: number;
  constructor(sessionId: string, snapshotSize: number, maxBytes: number);
}
export declare class SessionTranscriptPageTooLargeError extends Error {
  readonly sessionId: string;
  readonly pageBytes: number;
  readonly maxBytes: number;
  constructor(sessionId: string, pageBytes: number, maxBytes: number);
}
export interface SessionTranscriptCursorState {
  v: typeof SESSION_TRANSCRIPT_CURSOR_VERSION;
  sessionId: string;
  fileIdentity: SessionTranscriptFileIdentity;
  snapshotSize: number;
  position: number;
  /** Omitted for legacy oldest-to-newest cursors. */
  direction?: 'backward';
  leafUuid: string;
  startTime: string;
  lastUpdated: string;
  replay?: unknown;
}
export interface SessionTranscriptReadPageOptions {
  cursor?: string;
  /** Start a newest-to-oldest snapshot immediately before this active record. */
  beforeRecordId?: string;
  /** Start at the persisted tail and page newest-to-oldest. */
  direction?: 'backward';
  limit?: number;
  maxBytes?: number;
}
export interface SessionTranscriptRecordPage {
  sessionId: string;
  filePath: string;
  records: ChatRecord[];
  gaps: HistoryGap[];
  hasMore: boolean;
  direction?: 'backward';
  nextCursorState?: SessionTranscriptCursorState;
  replay?: unknown;
  startTime: string;
  lastUpdated: string;
}
interface SessionTranscriptFileIdentity {
  dev: number;
  ino: number;
}
export declare class SessionTranscriptCursorCodec {
  private readonly key;
  constructor(key: Uint8Array);
  encode(state: SessionTranscriptCursorState): string;
  decode(cursor: string): SessionTranscriptCursorState;
}
export declare function encodeSessionTranscriptCursor(
  state: SessionTranscriptCursorState,
  workspaceCwd: string,
): string;
export declare function decodeSessionTranscriptCursor(
  cursor: string,
  workspaceCwd: string,
): SessionTranscriptCursorState;
export declare function isReplayTurnStartType(
  type: ChatRecord['type'] | undefined,
  subtype: string | undefined,
): boolean;
export declare function findBoundaryAtOrBefore<T>(
  items: ArrayLike<T>,
  from: number,
  floor: number,
  isBoundary: (item: T) => boolean,
): number;
export declare class SessionTranscriptReader {
  private readonly workspaceCwd;
  private readonly cursorCodec?;
  private readonly storage;
  constructor(
    workspaceCwd: string,
    cursorCodec?: SessionTranscriptCursorCodec | undefined,
  );
  getSessionFilePath(sessionId: string): string;
  readPage(
    sessionId: string,
    options?: SessionTranscriptReadPageOptions,
  ): Promise<SessionTranscriptRecordPage>;
}
export declare function resetSessionTranscriptIndexCacheForTest(): void;
export declare function setSessionTranscriptIndexCacheMaxBytesForTest(
  maxBytes: number,
): void;
export declare function setSessionTranscriptExpandedPageBytesForTest(
  maxBytes: number,
): void;
export declare function getSessionTranscriptIndexCacheStatsForTest(): {
  entries: number;
  byteSize: number;
};
export {};
