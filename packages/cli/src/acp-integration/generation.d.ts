/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Stateless, tool-free generation for the daemon request-scoped SSE endpoint.
 * It deliberately bypasses GeminiChat so neither history nor recording is
 * read or mutated.
 */
import { type Config } from '@qwen-code/qwen-code-core';
export declare const GENERATION_MAX_PROMPT_BYTES: number;
export declare const GENERATION_TIMEOUT_MS = 60000;
export interface GenerationStartedEvent {
  type: 'started';
  model: string;
  modelSource: 'fast' | 'main';
}
export interface GenerationDeltaEvent {
  type: 'delta';
  seq: number;
  text: string;
}
export interface GenerationThinkingEvent {
  type: 'thinking';
}
export type GenerationEvent =
  | GenerationStartedEvent
  | GenerationThinkingEvent
  | GenerationDeltaEvent;
export interface GenerationResult {
  model: string;
  modelSource: 'fast' | 'main';
  inputTokens?: number;
  outputTokens?: number;
}
export declare function executeGeneration(
  config: Config,
  requestId: string,
  prompt: string,
  signal: AbortSignal,
  emit: (event: GenerationEvent) => Promise<void>,
): Promise<GenerationResult>;
