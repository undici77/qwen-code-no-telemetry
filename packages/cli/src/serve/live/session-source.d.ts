/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export declare const LIVE_SESSION_SOURCE_PREFIX = 'realtime_voice:';
export interface LiveSessionCreationMetadata {
  parentSessionId?: string;
  sourceType?: string;
  sourceId?: string;
}
export declare function isReservedLiveSessionSource(source: {
  sourceType?: string;
  sourceId?: string;
}): boolean;
export declare function isCompatibleLiveSessionSource(source: {
  sourceType?: string;
  sourceId?: string;
}): boolean;
export declare function readLoadableLiveConversationMetadata(
  sessionId: string,
  readMetadata: (sessionId: string) => Promise<LiveSessionCreationMetadata>,
): Promise<LiveSessionCreationMetadata | undefined>;
