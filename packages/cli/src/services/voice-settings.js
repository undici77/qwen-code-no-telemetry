/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { SettingScope } from '../config/settings.js';
export function readVoiceModel(settings) {
    const value = settings.merged?.voiceModel;
    if (typeof value !== 'string') {
        return undefined;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
}
export function isVoiceEnabled(settings) {
    return settings.merged?.general?.voice?.enabled === true;
}
export function readVoiceMode(settings) {
    return settings.merged?.general?.voice?.mode === 'tap' ? 'tap' : 'hold';
}
export function readVoiceLanguage(settings) {
    const language = settings.merged.general?.voice?.language;
    if (typeof language !== 'string') {
        return '';
    }
    return language.trim();
}
export function getVoiceSettingsScope(settings, workspaceTrusted = settings.isTrusted === true) {
    return workspaceTrusted &&
        typeof settings.workspace?.settings?.general?.voice?.enabled === 'boolean'
        ? SettingScope.Workspace
        : SettingScope.User;
}
export function isVoiceMode(value) {
    return value === 'hold' || value === 'tap';
}
//# sourceMappingURL=voice-settings.js.map