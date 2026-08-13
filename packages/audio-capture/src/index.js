/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { createRequire } from 'node:module';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getPlatformBackendName } from './platform.js';
const nativeRequire = createRequire(import.meta.url);
// dist/index.js → package root, which holds prebuilds/ and build/.
const packageRoot = dirname(dirname(fileURLToPath(import.meta.url)));
function loadBinding() {
    try {
        // Throws on unsupported platforms before touching the native layer.
        getPlatformBackendName();
        // node-gyp-build picks the matching prebuild from prebuilds/<platform>-<arch>,
        // falling back to a local build/Release compile — no compiler needed when a
        // prebuilt binary ships for the host.
        const loadPrebuild = nativeRequire('node-gyp-build');
        return loadPrebuild(packageRoot);
    }
    catch (error) {
        throw new Error('Native audio capture addon could not be loaded. Reinstall ' +
            '@qwen-code/audio-capture, or run "npm run build" in packages/audio-capture. ' +
            `(${error instanceof Error ? error.message : String(error)})`);
    }
}
export function createNativeAudioCaptureBackend(binding = loadBinding()) {
    const silenceDetected = binding.silenceDetected;
    const drainAudio = binding.drainAudio;
    const audioLevel = binding.audioLevel;
    return {
        startRecording: (options) => {
            binding.startRecording(options);
        },
        stopRecording: () => binding.stopRecording(),
        isRecording: () => binding.isRecording(),
        ...(drainAudio ? { drainAudio: () => drainAudio.call(binding) } : {}),
        ...(audioLevel ? { audioLevel: () => audioLevel.call(binding) } : {}),
        ...(silenceDetected
            ? { silenceDetected: () => silenceDetected.call(binding) }
            : {}),
        microphoneAuthorizationStatus: () => binding.microphoneAuthorizationStatus?.() ?? 'unknown',
    };
}
export { getPlatformBackendName } from './platform.js';
//# sourceMappingURL=index.js.map