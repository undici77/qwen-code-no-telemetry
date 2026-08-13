/**
 * @license
 * Copyright 2025 Qwen team
 * SPDX-License-Identifier: Apache-2.0
 */
export const SUPPORTED_LANGUAGES = [
    {
        code: 'en',
        id: 'en-US',
        fullName: 'English',
        nativeName: 'English',
    },
    {
        code: 'zh-TW',
        id: 'zh-TW',
        fullName: 'Traditional Chinese',
        nativeName: '繁體中文',
        strictParity: true,
    },
    {
        code: 'zh',
        id: 'zh-CN',
        fullName: 'Chinese',
        nativeName: '中文',
        strictParity: true,
    },
    {
        code: 'ru',
        id: 'ru-RU',
        fullName: 'Russian',
        nativeName: 'Русский',
    },
    {
        code: 'de',
        id: 'de-DE',
        fullName: 'German',
        nativeName: 'Deutsch',
    },
    {
        code: 'ja',
        id: 'ja-JP',
        fullName: 'Japanese',
        nativeName: '日本語',
    },
    {
        code: 'pt',
        id: 'pt-BR',
        fullName: 'Portuguese',
        nativeName: 'Português',
    },
    {
        code: 'fr',
        id: 'fr-FR',
        fullName: 'French',
        nativeName: 'Français',
    },
    {
        code: 'ca',
        id: 'ca-ES',
        fullName: 'Catalan',
        nativeName: 'Català',
    },
];
function normalizeLanguageCandidate(input) {
    return input.trim().replace(/_/g, '-').toLowerCase();
}
function matchesLocaleToken(candidate, token) {
    return (candidate === token ||
        candidate.startsWith(`${token}-`) ||
        candidate.startsWith(`${token}.`) ||
        candidate.startsWith(`${token}@`));
}
function getMatchedLocaleTokenLength(candidate, language) {
    const code = language.code.toLowerCase();
    const id = language.id.toLowerCase();
    if (matchesLocaleToken(candidate, id)) {
        return id.length;
    }
    if (matchesLocaleToken(candidate, code)) {
        return code.length;
    }
    return undefined;
}
/**
 * Resolves a language alias or locale ID to a supported canonical locale code.
 * Returns undefined for unsupported values so callers can preserve custom codes.
 */
export function resolveSupportedLanguage(input) {
    const normalized = normalizeLanguageCandidate(input);
    if (!normalized) {
        return undefined;
    }
    let bestMatch;
    for (const language of SUPPORTED_LANGUAGES) {
        if (normalized === language.fullName.toLowerCase() ||
            (language.nativeName && normalized === language.nativeName.toLowerCase())) {
            return language.code;
        }
        const tokenLength = getMatchedLocaleTokenLength(normalized, language);
        if (tokenLength !== undefined &&
            (!bestMatch || tokenLength > bestMatch.tokenLength)) {
            bestMatch = { code: language.code, tokenLength };
        }
    }
    return bestMatch?.code;
}
/**
 * Maps a locale code to its English language name.
 * Used for LLM output language instructions.
 */
export function getLanguageNameFromLocale(locale) {
    const resolved = resolveSupportedLanguage(locale);
    const lang = resolved
        ? SUPPORTED_LANGUAGES.find((language) => language.code === resolved)
        : undefined;
    return lang?.fullName || 'English';
}
/**
 * Gets the language options for the settings schema.
 */
export function getLanguageSettingsOptions() {
    return [
        { value: 'auto', label: 'Auto (detect from system)' },
        ...SUPPORTED_LANGUAGES.map((l) => ({
            value: l.code,
            label: l.nativeName
                ? `${l.nativeName} (${l.fullName})`
                : `${l.fullName} (${l.id})`,
        })),
    ];
}
/**
 * Gets a string containing all supported language IDs (e.g., "en-US|zh-CN").
 */
export function getSupportedLanguageIds(separator = '|') {
    return SUPPORTED_LANGUAGES.map((l) => l.id).join(separator);
}
//# sourceMappingURL=languages.js.map