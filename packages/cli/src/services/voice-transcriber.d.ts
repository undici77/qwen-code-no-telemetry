/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type { AvailableModel } from '@qwen-code/qwen-code-core';
import type { LoadedSettings } from '../config/settings.js';
import { resolveVoiceTransport } from './voice-model.js';
export { resolveVoiceTransport };
export type { VoiceTransport } from './voice-model.js';
export type VoiceStreamingTransport =
  | 'qwen-asr-realtime'
  | 'dashscope-task-realtime';
export interface RecordedVoiceAudio {
  data: Uint8Array;
  mimeType: string;
}
export interface VoiceTranscriptionConfig {
  model: string;
  baseUrl: string;
  apiKey?: string;
  allowInsecureBaseUrl?: boolean;
}
export interface VoiceStreamConfig {
  baseUrl: string;
  model: string;
  apiKey?: string;
  language?: string;
  keytermsContext?: string;
  allowInsecureBaseUrl?: boolean;
}
export interface ResolvedVoiceStreamConfig extends VoiceStreamConfig {
  transport: VoiceStreamingTransport;
}
export interface VoiceModelSource {
  getAllConfiguredModels(): AvailableModel[];
}
export type VoiceModelLookup = VoiceModelSource;
interface ResolveVoiceTranscriptionConfigArgs {
  config: VoiceModelSource;
  settings: LoadedSettings;
  voiceModel: string;
  env?: Readonly<Record<string, string | undefined>>;
}
interface TranscribeVoiceAudioArgs extends ResolveVoiceTranscriptionConfigArgs {
  fetchFn?: typeof fetch;
  lookupHost?: VoiceHostLookup;
  abortSignal?: AbortSignal;
  onEgress?: () => void;
}
type VoiceHostLookup = (hostname: string) => Promise<
  | {
      address: string;
    }
  | Array<{
      address: string;
    }>
>;
export declare function assertVoiceBaseUrlNetworkAllowed(
  voiceConfig: VoiceTranscriptionConfig,
  lookupHost?: VoiceHostLookup,
  abortSignal?: AbortSignal,
): Promise<void>;
export declare function resolveVoiceTranscriptionConfig({
  config,
  settings,
  voiceModel,
  env,
}: ResolveVoiceTranscriptionConfigArgs): VoiceTranscriptionConfig;
export declare function isStreamingVoiceModel(model: string): boolean;
/** Build a streaming (WebSocket) config from the configured voice provider. */
export declare function resolveVoiceStreamConfig(
  args: ResolveVoiceTranscriptionConfigArgs,
): ResolvedVoiceStreamConfig;
/**
 * On non-speech audio (silence/noise) Qwen-ASR can hallucinate the keyterm
 * context back as the transcript. Detect that — a multi-word result whose tokens
 * are almost entirely keyterms — so the bias list never lands in the prompt.
 * Short results are left alone so genuine terse utterances ("grep regex") pass.
 */
export declare function isKeytermEcho(
  transcript: string,
  keytermsContext?: string,
): boolean;
export declare const MAX_AUDIO_BYTES: number;
export declare function sanitizeVoiceErrorMessage(
  raw: string,
  apiKey?: string,
): string;
export declare function transcribeVoiceAudio(
  audio: RecordedVoiceAudio,
  args: TranscribeVoiceAudioArgs,
): Promise<string>;
