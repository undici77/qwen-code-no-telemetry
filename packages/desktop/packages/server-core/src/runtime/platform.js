/**
 * Platform services — dependency injection seam.
 *
 * SessionManager and core handlers receive this instead of importing
 * directly from 'electron'. On Electron, the implementations wrap
 * app/shell/nativeImage. On headless Node, they use sharp/pino/etc.
 */
// ── Logger helpers ──────────────────────────────────────────────────────────
const ANSI_RESET = '\x1b[0m';
const ANSI_GREEN = '\x1b[32m';
const ANSI_YELLOW = '\x1b[33m';
const ANSI_RED = '\x1b[31m';
const ANSI_MAGENTA = '\x1b[35m';
function shouldColor(stream) {
    if (typeof process === 'undefined')
        return false;
    if (process.env.NO_COLOR)
        return false;
    if (process.env.FORCE_COLOR && process.env.FORCE_COLOR !== '0')
        return true;
    return stream?.isTTY === true;
}
function levelColor(level) {
    switch (level) {
        case 'error':
            return ANSI_RED;
        case 'warn':
            return ANSI_YELLOW;
        case 'debug':
            return ANSI_MAGENTA;
        case 'info':
        default:
            return ANSI_GREEN;
    }
}
function colorizeArgs(level, args, stream) {
    if (!shouldColor(stream))
        return args;
    const color = levelColor(level);
    return args.map((arg) => typeof arg === 'string' ? `${color}${arg}${ANSI_RESET}` : arg);
}
function stdout() {
    return typeof process === 'undefined' ? undefined : process.stdout;
}
function stderr() {
    return typeof process === 'undefined' ? undefined : process.stderr;
}
/** Console-based Logger for use before platform initialization. */
export const CONSOLE_LOGGER = {
    info: (...args) => console.log(...colorizeArgs('info', args, stdout())),
    warn: (...args) => console.warn(...colorizeArgs('warn', args, stderr())),
    error: (...args) => console.error(...colorizeArgs('error', args, stderr())),
    debug: (...args) => console.debug(...colorizeArgs('debug', args, stderr())),
};
/** Create a Logger that prefixes every message with [scope]. */
export function createScopedLogger(base, scope) {
    return {
        info: (...args) => base.info(`[${scope}]`, ...args),
        warn: (...args) => base.warn(`[${scope}]`, ...args),
        error: (...args) => base.error(`[${scope}]`, ...args),
        debug: (...args) => base.debug(`[${scope}]`, ...args),
    };
}
//# sourceMappingURL=platform.js.map