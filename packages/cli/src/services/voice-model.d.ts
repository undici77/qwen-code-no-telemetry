/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { type AvailableModel } from '@qwen-code/qwen-code-core';
export type VoiceTransport =
  | 'qwen-asr-chat'
  | 'qwen-asr-realtime'
  | 'dashscope-task-realtime'
  | 'unsupported';
/** Map a model id to the ASR transport it uses, or 'unsupported'. */
export declare function resolveVoiceTransport(model: string): VoiceTransport;
/**
 * A model that can be used as a voice transcription provider: an OpenAI-compatible,
 * non-runtime model with a baseUrl. Transport-agnostic on purpose — the record-time
 * config resolver also uses this and then enforces the exact baseUrl/transport rules.
 */
export declare function isTranscribableVoiceModel(
  model: AvailableModel,
): boolean;
/**
 * Selection guard for `/model --voice` and the model dialog: transcribable AND a
 * model id we actually have an ASR transport for. This stops a non-ASR id (e.g. a
 * chat model picked by mistake) from being persisted as the voice model, where it
 * would report "enabled" in /voice status yet throw on every dictation.
 */
export declare function isSelectableVoiceModel(model: AvailableModel): boolean;
export declare function formatUnsupportedVoiceModelMessage(
  modelName: string,
): string;
