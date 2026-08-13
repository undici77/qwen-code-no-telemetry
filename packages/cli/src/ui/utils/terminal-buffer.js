/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import process from 'node:process';
export function isCiEnvKey(key) {
    return (key === 'CI' || key === 'CONTINUOUS_INTEGRATION' || key.startsWith('CI_'));
}
function isActiveCiValue(value) {
    const normalizedValue = value?.toLowerCase();
    return (value !== undefined &&
        value !== '' &&
        normalizedValue !== '0' &&
        normalizedValue !== 'false');
}
function isCiEnvironment(env) {
    return Object.keys(env).some((key) => isCiEnvKey(key) && isActiveCiValue(env[key]));
}
export function isInteractiveTerminal(stdoutIsTTY = process.stdout.isTTY, env = process.env) {
    return (Boolean(stdoutIsTTY) &&
        !isCiEnvironment(env) &&
        env['TERM']?.toLowerCase() !== 'dumb');
}
export function shouldUseVirtualViewport(useTerminalBuffer, screenReader, terminalInteractive) {
    // The settings loader does not apply schema defaults, so keep this fallback
    // in sync with settingsSchema.ts's default for ui.useTerminalBuffer.
    return terminalInteractive && (useTerminalBuffer ?? true) && !screenReader;
}
//# sourceMappingURL=terminal-buffer.js.map