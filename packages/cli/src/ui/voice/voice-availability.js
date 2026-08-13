/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { existsSync } from 'node:fs';
import process from 'node:process';
import { t } from '../../i18n/index.js';
const SUPPORTED_PLATFORMS = [
    'darwin',
    'linux',
    'win32',
];
function isWsl(env) {
    return Boolean(env['WSL_DISTRO_NAME'] || env['WSL_INTEROP']);
}
/**
 * Returns a human-readable reason if voice dictation cannot work in this
 * environment, or undefined when it should be available.
 */
export function getVoiceUnavailableReason(environment = {
    platform: process.platform,
    env: process.env,
}) {
    const { platform, env } = environment;
    const fileExists = environment.fileExists ?? existsSync;
    if (!SUPPORTED_PLATFORMS.includes(platform)) {
        return t('Voice dictation is not supported on {{platform}}.', {
            platform,
        });
    }
    if (platform === 'linux' &&
        isWsl(env) &&
        !env['PULSE_SERVER'] &&
        !fileExists('/mnt/wslg/PulseServer')) {
        return t('Voice dictation needs microphone access, which is unavailable in this WSL session. Use WSLg/PulseAudio, or run Qwen Code on a host with a microphone.');
    }
    return undefined;
}
//# sourceMappingURL=voice-availability.js.map