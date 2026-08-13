/**
 * Classification of external URLs for `shell.openExternal`-style handlers.
 *
 * We use a blocklist instead of an allowlist: the OS only dispatches URL
 * schemes that have a registered handler, so passing through
 * `obsidian://`, `vscode://`, etc. is safe in practice. Known-dangerous
 * schemes (XSS primitives and `file:` as an RCE vector on Windows) stay
 * explicitly blocked.
 */
const DANGEROUS_SCHEMES = new Set([
    'javascript:',
    'data:',
    'vbscript:',
    'blob:',
    'file:',
]);
const INTERNAL_DEEPLINK_SCHEME = 'craftagents:';
export function classifyExternalUrl(rawUrl) {
    if (typeof rawUrl !== 'string' || rawUrl.trim() === '') {
        return { kind: 'dangerous', reason: 'empty URL' };
    }
    let parsed;
    try {
        parsed = new URL(rawUrl.trim());
    }
    catch {
        return { kind: 'dangerous', reason: 'malformed URL' };
    }
    const protocol = parsed.protocol.toLowerCase();
    if (DANGEROUS_SCHEMES.has(protocol)) {
        return { kind: 'dangerous', reason: `blocked scheme "${protocol}"` };
    }
    if (protocol === INTERNAL_DEEPLINK_SCHEME) {
        return { kind: 'internal-deeplink' };
    }
    return { kind: 'safe-external' };
}
export function isSafeExternalUrl(rawUrl) {
    return classifyExternalUrl(rawUrl).kind === 'safe-external';
}
//# sourceMappingURL=url-safety.js.map