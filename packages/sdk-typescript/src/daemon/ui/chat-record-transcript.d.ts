/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { DaemonTranscriptBlock } from './types.js';
export interface ChatRecordTranscriptOptions {
  readonly leafUuid?: string;
  readonly maxBlocks?: number;
}
export interface TranscriptProjectionDiagnostic {
  readonly code: string;
  readonly severity: 'info' | 'warning' | 'error';
  readonly message: string;
  readonly affectsCompleteness: boolean;
  readonly recordIndex?: number;
  readonly recordId?: string;
  readonly path?: string;
}
export interface ChatRecordTranscriptProjection {
  readonly blocks: readonly DaemonTranscriptBlock[];
  readonly diagnostics: readonly TranscriptProjectionDiagnostic[];
  readonly complete: boolean;
  readonly truncated: boolean;
}
export type TranscriptProjectionInputErrorCode =
  | 'invalid_records'
  | 'invalid_max_blocks'
  | 'leaf_not_found'
  | 'mixed_session_ids';
export declare class TranscriptProjectionInputError extends TypeError {
  readonly code: TranscriptProjectionInputErrorCode;
  constructor(code: TranscriptProjectionInputErrorCode, message: string);
}
export declare function projectChatRecordsToDaemonTranscript(
  records: readonly unknown[],
  options?: ChatRecordTranscriptOptions,
): ChatRecordTranscriptProjection;
