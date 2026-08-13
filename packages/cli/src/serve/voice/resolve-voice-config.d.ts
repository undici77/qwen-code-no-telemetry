/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type { LoadedSettings } from '../../config/settings.js';
import { type VoiceModelLookup } from '../../services/voice-transcriber.js';
/**
 * Fully-validated voice context for a daemon workspace. The browser captures
 * audio and streams raw PCM to `/voice/stream`; the daemon resolves the
 * configured voice model here (reusing the CLI voice resolver) and transcribes
 * server-side so provider credentials never reach the client.
 */
export interface DaemonVoiceContext {
    settings: LoadedSettings;
    /** A `ModelsConfig` — satisfies the resolver's structural `getAllConfiguredModels`. */
    models: VoiceModelLookup;
    env?: Readonly<Record<string, string | undefined>>;
    voiceModel: string;
    /** True for realtime models (open an upstream WS); false → batch on stop. */
    streaming: boolean;
}
/**
 * Load and validate the workspace's voice configuration. Throws when voice is
 * not usable (no `voiceModel` configured, model not transcribable, missing
 * baseUrl/apiKey) — the throw message is a safe, user-facing reason.
 */
export declare function loadDaemonVoiceContext(workspaceCwd: string, options?: {
    env?: Readonly<Record<string, string | undefined>>;
    workspaceTrusted?: boolean;
}): DaemonVoiceContext;
