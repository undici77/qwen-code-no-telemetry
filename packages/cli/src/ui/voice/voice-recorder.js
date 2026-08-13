/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import process from 'node:process';
import { createDebugLogger } from '@qwen-code/qwen-code-core';
import { createArecordRecorder } from './arecord-recorder.js';
import { createNativeAudioRecorder } from './native-audio-recorder.js';
import { createSoxRecorder } from './sox-recorder.js';
const debugLogger = createDebugLogger('VOICE_RECORDER');
class FallbackVoiceRecorder {
    factories;
    activeRecorder = null;
    recorders = new Map();
    constructor(factories) {
        this.factories = factories;
    }
    recorderFor(factory) {
        let recorder = this.recorders.get(factory);
        if (!recorder) {
            recorder = factory();
            this.recorders.set(factory, recorder);
        }
        return recorder;
    }
    async start(options) {
        const errors = [];
        for (const factory of this.factories) {
            const recorder = this.recorderFor(factory);
            try {
                await recorder.start(options);
                this.activeRecorder = recorder;
                return;
            }
            catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                errors.push(message);
                // Surface each backend failure so a missing native prebuild — which
                // otherwise silently degrades to the SoX/arecord fallback — is
                // diagnosable in debug logs instead of invisible. See #5583.
                debugLogger.warn(`[voice] recorder backend unavailable, trying fallback: ${message}`);
            }
        }
        throw new Error(`Voice recording is unavailable. ${errors.filter(Boolean).join(' ')}`);
    }
    async stop() {
        const recorder = this.activeRecorder;
        if (!recorder) {
            throw new Error('Voice recorder was not started.');
        }
        this.activeRecorder = null;
        return recorder.stop();
    }
    // Best-effort preload of any backend that supports it (the native one).
    async warmup() {
        for (const factory of this.factories) {
            try {
                await this.recorderFor(factory).warmup?.();
            }
            catch (error) {
                debugLogger.warn('[voice] recorder warmup failed:', error);
                // Ignore — start() will still try/fall back at record time.
            }
        }
    }
    drain() {
        return this.activeRecorder?.drain?.() ?? new Uint8Array(0);
    }
    supportsStreaming() {
        return this.activeRecorder?.supportsStreaming?.() ?? false;
    }
    audioLevel() {
        return this.activeRecorder?.audioLevel?.() ?? 0;
    }
    // Permission from the first backend that can report it (the native one).
    async microphoneStatus() {
        for (const factory of this.factories) {
            const recorder = this.recorderFor(factory);
            if (recorder.microphoneStatus) {
                try {
                    return await recorder.microphoneStatus();
                }
                catch {
                    // Try the next backend.
                }
            }
        }
        return 'unknown';
    }
}
export function createVoiceRecorder(options = {}) {
    const platform = options.platform ?? process.platform;
    const factories = [
        options.createNativeRecorder ?? createNativeAudioRecorder,
    ];
    // arecord (ALSA) only exists on Linux; elsewhere it would just fail fast.
    if (platform === 'linux') {
        factories.push(options.createSoxRecorder ?? createSoxRecorder);
        factories.push(options.createArecordRecorder ?? createArecordRecorder);
    }
    else {
        factories.push(options.createSoxRecorder ?? createSoxRecorder);
    }
    return new FallbackVoiceRecorder(factories);
}
//# sourceMappingURL=voice-recorder.js.map