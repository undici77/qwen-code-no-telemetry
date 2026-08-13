/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { redactLogCredentials } from '@qwen-code/acp-bridge/logRedaction';
const MAX_REMEMBER_ERROR_DETAILS_CHARS = 1000;
const MAX_REMEMBER_ERROR_CAUSE_DEPTH = 50;
const REMEMBER_ERROR_FORMAT_RE = /[\p{Cf}]|\p{Variation_Selector}/gu;
const REMEMBER_ERROR_SPACE_SEPARATOR_RE = /[\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000]/gu;
/* eslint-disable no-control-regex */
const REMEMBER_ERROR_CREDENTIAL_SEPARATOR_RE = /[\x00-\x1f\x7f-\x9f\p{Cf}\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000]|\p{Variation_Selector}/gu;
const REMEMBER_ERROR_AUTH_SCHEME_INVISIBLE_RE = /\b(Bearer|QQBot)(?:[\x00-\x1f\x7f-\x9f\p{Cf}\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000]|\p{Variation_Selector})+(?=[A-Za-z0-9._~+/=-])/giu;
const REMEMBER_ERROR_AUTH_TOKEN_WITH_SEPARATORS_RE = /\b(Bearer|QQBot)(?:\s|[\x00-\x1f\x7f-\x9f\p{Cf}\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000]|\p{Variation_Selector})+((?:[A-Za-z0-9._~+/=-]+(?:[\x00-\x1f\x7f-\x9f\p{Cf}\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000]|\p{Variation_Selector})+)*[A-Za-z0-9._~+/=-]+)/giu;
const REMEMBER_ERROR_BARE_TOKEN_WITH_SEPARATORS_RE = /\b(?:sk-|ghp_|gho_|ghs_|ghu_|github_pat_|glpat-|xox[b]-|xox[p]-)(?:[A-Za-z0-9_-]+(?:[\x00-\x1f\x7f-\x9f\p{Cf}\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000]|\p{Variation_Selector})+)*[A-Za-z0-9_-]+/gu;
const REMEMBER_ERROR_AWS_KEY_WITH_SEPARATORS_RE = /\b(?:AKIA|ASIA)(?:[A-Z0-9]+(?:[\x00-\x1f\x7f-\x9f\p{Cf}\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000]|\p{Variation_Selector})+)*[A-Z0-9]+/gu;
const REMEMBER_ERROR_SECRET_ASSIGNMENT_WITH_SEPARATORS_RE = /((?:api[_-]?key|token|secret|password|pwd)[_-]?[=:]\s*)((?:\S+(?:[\x00-\x1f\x7f-\x9f\p{Cf}\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000]|\p{Variation_Selector})+)*\S+)/giu;
const REMEMBER_ERROR_ENV_SECRET_ASSIGNMENT_WITH_SEPARATORS_RE = /([A-Z][A-Z0-9]{0,50}(?:_[A-Z0-9]{1,50}){0,10}_(?:KEY|TOKEN|SECRET|PASSWORD)\s*[=:]\s*)((?:\S+(?:[\x00-\x1f\x7f-\x9f\p{Cf}\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000]|\p{Variation_Selector})+)*\S+)/gu;
const REMEMBER_ERROR_URL_CREDENTIALS_WITH_SEPARATORS_RE = /(\b[a-z][a-z0-9+.-]{0,31}:\/\/)([^/@\s]*(?:[\x00-\x1f\x7f-\x9f\p{Cf}\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000]|\p{Variation_Selector})+[^/@\s]*)@/giu;
const REMEMBER_ERROR_CONTROL_RE = /[\x00-\x1f\x7f-\x9f]/g;
/* eslint-enable no-control-regex */
const DETAIL_SUPPRESSED_REMEMBER_ERROR_CODES = new Set([
    'managed_memory_unavailable',
]);
export function createWorkspaceMemoryExtractionErrorLogger(logger) {
    return (target, err) => {
        logger.warn(`Failed to extract workspace memory error ${target}:`, {
            extractionError: err instanceof Error ? err.message : String(err),
        });
    };
}
function reportRememberErrorExtractionFailure(onExtractionError, target, err) {
    try {
        onExtractionError?.(target, err);
    }
    catch {
        // Preserve fallback behavior if extraction logging fails.
    }
}
function errorCodeFromRecord(record) {
    if (typeof record['code'] === 'string')
        return record['code'];
    const data = record['data'];
    if (data && typeof data === 'object') {
        const dataRecord = data;
        if (typeof dataRecord['errorKind'] === 'string') {
            return dataRecord['errorKind'];
        }
        if (typeof dataRecord['code'] === 'string')
            return dataRecord['code'];
    }
    return undefined;
}
function rawRememberErrorCode(err, seen, depth) {
    if (depth > MAX_REMEMBER_ERROR_CAUSE_DEPTH)
        return undefined;
    if (!err || typeof err !== 'object')
        return undefined;
    if (seen.has(err))
        return undefined;
    seen.add(err);
    const record = err;
    const direct = errorCodeFromRecord(record);
    if (direct)
        return direct;
    const cause = record['cause'];
    if (cause != null) {
        return rawRememberErrorCode(cause, seen, depth + 1);
    }
    return undefined;
}
export function extractRememberErrorCode(err, fallback = 'remember_failed') {
    return rawRememberErrorCode(err, new WeakSet(), 0) ?? fallback;
}
export function workspaceMemoryFailureCode(err, fallback = 'remember_failed', onExtractionError) {
    try {
        return extractRememberErrorCode(err, fallback);
    }
    catch (extractionErr) {
        reportRememberErrorExtractionFailure(onExtractionError, 'code', extractionErr);
        return fallback;
    }
}
function detailFromRecord(record, seen, depth) {
    // Bridge errors carry the best failure reason in `data`; top-level
    // `message` and `cause` are generic fallbacks.
    const data = record['data'];
    if (data && typeof data === 'object') {
        const dataRecord = data;
        const details = dataRecord['details'];
        if (typeof details === 'string' && details.length > 0)
            return details;
        const message = dataRecord['message'];
        if (typeof message === 'string' && message.length > 0)
            return message;
    }
    const message = record['message'];
    if (typeof message === 'string' && message.length > 0)
        return message;
    if (typeof data === 'string' && data.length > 0)
        return data;
    const cause = record['cause'];
    if (cause != null) {
        return rawRememberErrorDetails(cause, seen, depth + 1);
    }
    return undefined;
}
function rawRememberErrorDetails(err, seen, depth) {
    if (depth > MAX_REMEMBER_ERROR_CAUSE_DEPTH)
        return undefined;
    if (typeof err === 'string' && err.length > 0)
        return err;
    if (!err || typeof err !== 'object')
        return undefined;
    if (seen.has(err))
        return undefined;
    seen.add(err);
    return detailFromRecord(err, seen, depth);
}
function replaceControlChars(details) {
    return details
        .replace(REMEMBER_ERROR_AUTH_SCHEME_INVISIBLE_RE, '$1 ')
        .replace(REMEMBER_ERROR_FORMAT_RE, '')
        .replace(REMEMBER_ERROR_SPACE_SEPARATOR_RE, ' ')
        .replace(REMEMBER_ERROR_CONTROL_RE, ' ');
}
function replaceStackControlChars(stack) {
    return stack
        .replace(REMEMBER_ERROR_AUTH_SCHEME_INVISIBLE_RE, '$1 ')
        .replace(REMEMBER_ERROR_FORMAT_RE, '')
        .replace(REMEMBER_ERROR_SPACE_SEPARATOR_RE, ' ')
        .replace(REMEMBER_ERROR_CONTROL_RE, (char) => char === '\n' || char === '\r' || char === '\t' ? char : ' ');
}
function collapseCredentialSeparators(text) {
    return text
        .replace(REMEMBER_ERROR_URL_CREDENTIALS_WITH_SEPARATORS_RE, (_match, scheme, userinfo) => `${scheme}${userinfo.replace(REMEMBER_ERROR_CREDENTIAL_SEPARATOR_RE, '')}@`)
        .replace(REMEMBER_ERROR_AUTH_TOKEN_WITH_SEPARATORS_RE, (_match, scheme, token) => `${scheme} ${token.replace(REMEMBER_ERROR_CREDENTIAL_SEPARATOR_RE, '')}`)
        .replace(REMEMBER_ERROR_BARE_TOKEN_WITH_SEPARATORS_RE, (token) => token.replace(REMEMBER_ERROR_CREDENTIAL_SEPARATOR_RE, ''))
        .replace(REMEMBER_ERROR_AWS_KEY_WITH_SEPARATORS_RE, (token) => token.replace(REMEMBER_ERROR_CREDENTIAL_SEPARATOR_RE, ''))
        .replace(REMEMBER_ERROR_SECRET_ASSIGNMENT_WITH_SEPARATORS_RE, (_match, prefix, value) => `${prefix}${value.replace(REMEMBER_ERROR_CREDENTIAL_SEPARATOR_RE, '')}`)
        .replace(REMEMBER_ERROR_ENV_SECRET_ASSIGNMENT_WITH_SEPARATORS_RE, (_match, prefix, value) => `${prefix}${value.replace(REMEMBER_ERROR_CREDENTIAL_SEPARATOR_RE, '')}`);
}
function collapseCredentialSeparatorsByStackLine(stack) {
    return stack
        .split(/(\r\n|\n|\r)/)
        .map((part) => part === '\r\n' || part === '\n' || part === '\r'
        ? part
        : collapseCredentialSeparators(part))
        .join('');
}
function isHighSurrogate(codeUnit) {
    return codeUnit >= 0xd800 && codeUnit <= 0xdbff;
}
function isLowSurrogate(codeUnit) {
    return codeUnit >= 0xdc00 && codeUnit <= 0xdfff;
}
function truncateBeforeDanglingSurrogate(details, cutPoint) {
    const beforeCut = details.charCodeAt(cutPoint - 1);
    const atCut = details.charCodeAt(cutPoint);
    if (isHighSurrogate(beforeCut) && isLowSurrogate(atCut)) {
        return cutPoint - 1;
    }
    return cutPoint;
}
function capRememberErrorText(redacted) {
    if (redacted.length <= MAX_REMEMBER_ERROR_DETAILS_CHARS)
        return redacted;
    const truncationSuffix = '... [truncated]';
    const cutPoint = truncateBeforeDanglingSurrogate(redacted, MAX_REMEMBER_ERROR_DETAILS_CHARS - truncationSuffix.length);
    return `${redacted.slice(0, cutPoint)}${truncationSuffix}`;
}
function redactAndCapRememberErrorText(normalized) {
    const redacted = redactLogCredentials(normalized).trim();
    if (!redacted)
        return undefined;
    return capRememberErrorText(redacted);
}
function sanitizeRememberErrorDetails(details) {
    // Keep credential normalization before redaction; auth schemes and token
    // values may otherwise be split by invisible characters.
    return redactAndCapRememberErrorText(replaceControlChars(collapseCredentialSeparators(details)));
}
function sanitizeRememberErrorStack(stack) {
    return redactAndCapRememberErrorText(replaceStackControlChars(collapseCredentialSeparatorsByStackLine(stack)));
}
export function extractRememberErrorDetails(err) {
    const raw = rawRememberErrorDetails(err, new WeakSet(), 0);
    if (!raw)
        return undefined;
    return sanitizeRememberErrorDetails(raw);
}
export function extractRememberErrorStack(err) {
    if (!(err instanceof Error) || !err.stack)
        return undefined;
    return sanitizeRememberErrorStack(err.stack);
}
export function shouldSuppressRememberErrorDetails(code) {
    return DETAIL_SUPPRESSED_REMEMBER_ERROR_CODES.has(code);
}
export function workspaceMemoryFailureDiagnostics(err, onExtractionError) {
    let details;
    let stack;
    try {
        details = extractRememberErrorDetails(err);
    }
    catch (extractionErr) {
        reportRememberErrorExtractionFailure(onExtractionError, 'details', extractionErr);
        details = undefined;
    }
    try {
        stack = extractRememberErrorStack(err);
    }
    catch (extractionErr) {
        reportRememberErrorExtractionFailure(onExtractionError, 'stack', extractionErr);
        stack = undefined;
    }
    return {
        ...(details ? { details } : {}),
        debugDetails: details ?? '<details unavailable>',
        ...(stack ? { stack } : {}),
    };
}
//# sourceMappingURL=workspace-remember-errors.js.map