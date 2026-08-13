/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
export function getString(value, key) {
    if (!isRecord(value))
        return undefined;
    const entry = value[key];
    return typeof entry === 'string' ? entry : undefined;
}
export function getFirstString(value, keys) {
    if (!isRecord(value))
        return undefined;
    for (const key of keys) {
        const entry = value[key];
        if (typeof entry === 'string' && entry.trim().length > 0) {
            return entry;
        }
    }
    return undefined;
}
export function stringifyJson(value) {
    if (value === undefined)
        return '';
    if (typeof value === 'string')
        return value;
    try {
        return JSON.stringify(value, null, 2) ?? String(value);
    }
    catch {
        return String(value);
    }
}
export function stringifyRedactedJson(value) {
    return stringifyJson(redactSensitiveFields(value));
}
export function redactSensitiveFields(value, depth = 0) {
    if (depth > 16)
        return '[truncated]';
    if (Array.isArray(value)) {
        return value.map((entry) => redactSensitiveFields(entry, depth + 1));
    }
    if (!isRecord(value))
        return value;
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [
        key,
        isSensitiveKey(key)
            ? '[redacted]'
            : redactSensitiveFields(entry, depth + 1),
    ]));
}
export function isSensitiveKey(key) {
    const normalized = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    return (
    // Exact matches — only keep names NOT already covered by the suffix
    // / substring rules below. wenshao R3 (qwen3.7-max): the following
    // were redundant and removed — `password` / `apikey` / `idtoken` /
    // `sessiontoken` / `clientsecret` / `xapikey` / `xauthtoken` —
    // already caught by `endsWith('password' | 'token' | 'secret' |
    // 'apikey')` respectively.
    normalized === 'authorization' ||
        normalized === 'auth' ||
        normalized === 'cookie' ||
        normalized === 'setcookie' ||
        normalized === 'credential' ||
        normalized === 'credentials' ||
        normalized === 'passphrase' ||
        normalized === 'xauthkey' ||
        // Suffix matches — each pattern listed once.
        normalized.endsWith('password') ||
        normalized.endsWith('token') ||
        normalized.endsWith('secret') ||
        normalized.endsWith('secretkey') ||
        normalized.endsWith('accesskey') ||
        normalized.endsWith('apikey') ||
        normalized.endsWith('privatekey') ||
        // Token-shaped substrings.
        normalized.includes('accesstoken') ||
        normalized.includes('refreshtoken') ||
        normalized.includes('bearertoken') ||
        normalized.includes('personalaccesstoken'));
}
export function getTextContent(value) {
    if (typeof value === 'string')
        return value;
    if (!isRecord(value))
        return '';
    const text = value['text'];
    return typeof text === 'string' ? text : '';
}
export function extractContentPart(value) {
    if (typeof value === 'string')
        return { kind: 'text', text: value };
    if (!isRecord(value))
        return undefined;
    const type = value['type'];
    if (type === 'text' || type === undefined) {
        const text = value['text'];
        if (typeof text === 'string')
            return { kind: 'text', text };
        return undefined;
    }
    if (type === 'image') {
        // Support both formats:
        // 1. { type: 'image', source: { data/url, mediaType } } (SDK format)
        // 2. { type: 'image', data, mimeType } (daemon echo / web-shell format)
        // 3. { type: 'image', data, media_type } (legacy format)
        const source = isRecord(value['source']) ? value['source'] : undefined;
        let url;
        let data;
        if (source) {
            url =
                typeof source['url'] === 'string'
                    ? source['url']
                    : undefined;
            data =
                typeof source['data'] === 'string'
                    ? source['data']
                    : undefined;
        }
        // Fallback: check root-level data (daemon echo format)
        if (!url && !data) {
            data =
                typeof value['data'] === 'string'
                    ? value['data']
                    : undefined;
            url =
                typeof value['url'] === 'string' ? value['url'] : undefined;
        }
        if (!url && !data)
            return undefined;
        const mediaType = (typeof value['mediaType'] === 'string'
            ? value['mediaType']
            : undefined) ??
            (typeof value['mimeType'] === 'string'
                ? value['mimeType']
                : undefined) ??
            (typeof value['media_type'] === 'string'
                ? value['media_type']
                : undefined) ??
            (source && typeof source['mediaType'] === 'string'
                ? source['mediaType']
                : undefined) ??
            'image/*';
        return {
            kind: 'image',
            mediaType,
            source: { ...(url ? { url } : {}), ...(data ? { data } : {}) },
        };
    }
    if (type === 'audio') {
        const source = isRecord(value['source']) ? value['source'] : undefined;
        if (!source)
            return undefined;
        const mediaType = (typeof value['mediaType'] === 'string'
            ? value['mediaType']
            : undefined) ?? 'audio/*';
        const url = typeof source['url'] === 'string' ? source['url'] : undefined;
        const data = typeof source['data'] === 'string'
            ? source['data']
            : undefined;
        if (!url && !data)
            return undefined;
        return {
            kind: 'audio',
            mediaType,
            source: { ...(url ? { url } : {}), ...(data ? { data } : {}) },
        };
    }
    if (type === 'resource' || type === 'resource_link') {
        const uri = typeof value['uri'] === 'string' ? value['uri'] : undefined;
        if (!uri)
            return undefined;
        const mediaType = typeof value['mediaType'] === 'string'
            ? value['mediaType']
            : undefined;
        const description = typeof value['description'] === 'string'
            ? value['description']
            : undefined;
        return {
            kind: 'resource',
            uri,
            ...(mediaType ? { mediaType } : {}),
            ...(description ? { description } : {}),
        };
    }
    return undefined;
}
const MAX_OUTPUT_TEXT_DEPTH = 64;
export function getOutputText(value, depth = 0) {
    if (depth > MAX_OUTPUT_TEXT_DEPTH)
        return '[output truncated]';
    if (typeof value === 'string')
        return value;
    if (Array.isArray(value)) {
        return value
            .map((entry) => getOutputText(entry, depth + 1))
            .filter(Boolean)
            .join('\n');
    }
    if (!isRecord(value))
        return value === undefined ? '' : stringifyJson(value);
    for (const key of ['text', 'output', 'stdout', 'stderr', 'rawOutput']) {
        const entry = value[key];
        if (typeof entry === 'string')
            return entry;
    }
    const content = value['content'];
    if (content !== undefined) {
        const nested = getOutputText(content, depth + 1);
        if (nested)
            return nested;
    }
    return stringifyJson(value);
}
export function sanitizeTerminalText(text) {
    return text
        .replace(bidiControlPattern, '')
        .replace(oscSequencePattern, '')
        .replace(dcsSequencePattern, '')
        .replace(csiSequencePattern, '')
        .replace(controlCharactersPattern, '');
}
export function stripOscSequences(text) {
    return text.replace(oscSequencePattern, '');
}
const nul = String.fromCharCode(0x00);
const backspace = String.fromCharCode(0x08);
const verticalTab = String.fromCharCode(0x0b);
const formFeed = String.fromCharCode(0x0c);
const carriageReturn = String.fromCharCode(0x0d);
const shiftOut = String.fromCharCode(0x0e);
const unitSeparator = String.fromCharCode(0x1f);
const deleteChar = String.fromCharCode(0x7f);
const c1End = String.fromCharCode(0x9f);
const escapeChar = String.fromCharCode(0x1b);
const bell = String.fromCharCode(0x07);
const controlCharactersPattern = new RegExp(`[${nul}-${backspace}${verticalTab}${formFeed}${carriageReturn}${shiftOut}-${unitSeparator}${deleteChar}-${c1End}]`, 'g');
const oscSequencePattern = new RegExp(`${escapeChar}\\][^${bell}${escapeChar}]*(?:${bell}|${escapeChar}\\\\)`, 'g');
const dcsSequencePattern = new RegExp(`${escapeChar}P[^${escapeChar}]*${escapeChar}\\\\`, 'g');
const csiSequencePattern = new RegExp(`${escapeChar}\\[[0-?]*[ -/]*[@-~]`, 'g');
const bidiControlPattern = /[\u200e\u200f\u202a-\u202e\u2066-\u2069]/g;
//# sourceMappingURL=utils.js.map