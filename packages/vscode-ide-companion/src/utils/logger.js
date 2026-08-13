/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
export const LOG_LEVELS = ['debug', 'error', 'info', 'log', 'warn'];
const sensitiveKeys = new Set([
    'accesstoken',
    'apikey',
    'authorization',
    'cookie',
    'password',
    'refreshtoken',
    'secret',
    'token',
]);
const defaultSink = (level, args) => {
    globalThis.console[level](...args);
};
let sink = defaultSink;
function formatValue(value) {
    if (typeof value === 'string') {
        return value;
    }
    if (value instanceof Error) {
        return value.stack ?? value.message;
    }
    const seen = new WeakSet();
    try {
        return (JSON.stringify(value, (key, nestedValue) => {
            const normalizedKey = key.replace(/[-_]/g, '').toLowerCase();
            if (sensitiveKeys.has(normalizedKey)) {
                return '<redacted>';
            }
            if (typeof nestedValue === 'bigint') {
                return `${nestedValue}n`;
            }
            if (nestedValue instanceof Error) {
                return nestedValue.stack ?? nestedValue.message;
            }
            if (typeof nestedValue === 'object' && nestedValue !== null) {
                if (seen.has(nestedValue)) {
                    return '[Circular]';
                }
                seen.add(nestedValue);
            }
            return nestedValue;
        }) ?? String(value));
    }
    catch {
        return String(value);
    }
}
export function formatLogArgs(args) {
    return args.map(formatValue).join(' ');
}
export function isLogLevel(value) {
    return LOG_LEVELS.includes(value);
}
export function resetLoggerSink() {
    sink = defaultSink;
}
export const logger = {
    debug: (...args) => sink('debug', args),
    error: (...args) => sink('error', args),
    info: (...args) => sink('info', args),
    log: (...args) => sink('log', args),
    warn: (...args) => sink('warn', args),
};
export function createLogger(outputChannel, sanitize = (message) => message) {
    sink = (level, args) => {
        const label = level === 'log' ? 'INFO' : level.toUpperCase();
        const line = sanitize(`[${label}] ${formatLogArgs(args)}`);
        try {
            outputChannel.appendLine(line);
        }
        catch {
            globalThis.console[level](line);
        }
    };
}
//# sourceMappingURL=logger.js.map