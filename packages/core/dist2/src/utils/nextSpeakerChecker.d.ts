/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { GeminiChat } from '../core/geminiChat.js';
import type { Config } from '../config/config.js';
export interface NextSpeakerResponse {
    reasoning: string;
    next_speaker: 'user' | 'model';
}
export declare function checkNextSpeaker(chat: GeminiChat, config: Config, abortSignal: AbortSignal, promptId: string): Promise<NextSpeakerResponse | null>;
