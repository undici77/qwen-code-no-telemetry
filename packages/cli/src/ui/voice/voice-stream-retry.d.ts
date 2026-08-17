/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type { VoiceStreamSession } from './voice-stream-session.js';
export declare function openVoiceStreamWithRetry(
  open: () => Promise<VoiceStreamSession>,
  opts?: {
    abortSignal?: AbortSignal;
  },
): Promise<VoiceStreamSession>;
