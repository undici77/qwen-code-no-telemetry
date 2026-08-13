/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { createDebugLogger } from '@qwen-code/qwen-code-core';
// Native silence detection sets a flag we poll for; older addons lack it.
const SILENCE_POLL_INTERVAL_MS = 200;
const debugLogger = createDebugLogger('VOICE_NATIVE_RECORDER');
const AUDIO_CAPTURE_PACKAGE = '@qwen-code/audio-capture';
class NativeAudioRecorder {
    loadBackend;
    backend = null;
    silencePoll = null;
    starting = false;
    constructor(loadBackend) {
        this.loadBackend = loadBackend;
    }
    clearSilencePoll() {
        if (this.silencePoll) {
            clearInterval(this.silencePoll);
            this.silencePoll = null;
        }
    }
    // Pay the dynamic-import + dlopen cost up front so the first start() is warm.
    async warmup() {
        await this.loadBackend();
    }
    async microphoneStatus() {
        const backend = await this.loadBackend();
        return backend.microphoneAuthorizationStatus();
    }
    drain() {
        return this.backend?.drainAudio?.() ?? new Uint8Array(0);
    }
    supportsStreaming() {
        return typeof this.backend?.drainAudio === 'function';
    }
    audioLevel() {
        return this.backend?.audioLevel?.() ?? 0;
    }
    async start(options = {}) {
        if (this.backend || this.starting) {
            throw new Error('Native voice recorder is already recording.');
        }
        this.starting = true;
        let backend;
        try {
            try {
                backend = await this.loadBackend();
            }
            catch (loadError) {
                throw explainMissingNativePackage(loadError);
            }
            const silenceDetection = options.silenceDetection === true;
            backend.startRecording({
                sampleRate: 16000,
                channels: 1,
                silenceDetection,
            });
            this.backend = backend;
            this.starting = false;
            const { onAutoStop } = options;
            if (silenceDetection && onAutoStop && backend.silenceDetected) {
                this.silencePoll = setInterval(() => {
                    try {
                        if (this.backend?.silenceDetected?.()) {
                            this.clearSilencePoll();
                            onAutoStop();
                        }
                    }
                    catch (error) {
                        this.clearSilencePoll();
                        debugLogger.warn('[voice] silence detection failed, auto-stopping:', error);
                        onAutoStop();
                    }
                }, SILENCE_POLL_INTERVAL_MS);
            }
        }
        catch (error) {
            this.starting = false;
            throw error;
        }
    }
    async stop() {
        this.clearSilencePoll();
        if (!this.backend) {
            throw new Error('Native voice recorder was not started.');
        }
        try {
            const data = this.backend.stopRecording();
            return {
                data,
                mimeType: 'audio/wav',
            };
        }
        finally {
            this.backend = null;
        }
    }
}
async function loadDefaultBackend() {
    const { createNativeAudioCaptureBackend } = await import('@qwen-code/audio-capture');
    return createNativeAudioCaptureBackend();
}
function explainMissingNativePackage(error) {
    if (!(error instanceof Error) || !isMissingNativePackageError(error)) {
        return error;
    }
    debugLogger.warn('[voice] native package missing:', error.message, error.code);
    return new Error(`Native voice capture package '${AUDIO_CAPTURE_PACKAGE}' is missing. ` +
        'If Qwen Code was installed from a mirror or private registry, the ' +
        'registry may not have synced this optional package. Reinstall from ' +
        'https://registry.npmjs.org or make sure the configured registry ' +
        `provides ${AUDIO_CAPTURE_PACKAGE}. (${error.message})`, { cause: error });
}
function isMissingNativePackageError(error) {
    const code = error.code;
    if (code === 'ERR_MODULE_NOT_FOUND' || code === 'MODULE_NOT_FOUND') {
        return error.message.includes(AUDIO_CAPTURE_PACKAGE);
    }
    return (error.message.includes(AUDIO_CAPTURE_PACKAGE) &&
        (error.message.startsWith('Cannot find package') ||
            error.message.startsWith('Cannot find module')));
}
export function createNativeAudioRecorder(options = {}) {
    return new NativeAudioRecorder(options.loadBackend ?? loadDefaultBackend);
}
//# sourceMappingURL=native-audio-recorder.js.map