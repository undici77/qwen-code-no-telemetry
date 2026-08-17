/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type {
  SocketLike,
  VoiceStreamCallbacks,
  VoiceStreamConfig,
  VoiceStreamSession,
} from './voice-stream-session.js';
export interface QwenRealtimeDeps {
  createWebSocket?: (
    url: string,
    options: {
      headers: Record<string, string>;
    },
  ) => SocketLike;
  abortSignal?: AbortSignal;
}
export declare function deriveQwenRealtimeUrl(
  baseUrl: string,
  model: string,
): string;
export declare function openQwenAsrRealtimeStream(
  config: VoiceStreamConfig,
  callbacks?: VoiceStreamCallbacks,
  deps?: QwenRealtimeDeps,
): Promise<VoiceStreamSession>;
