/**
 * Auth Types (Browser-safe)
 *
 * Pure type definitions for authentication state.
 * No runtime dependencies - safe for browser bundling.
 */
/**
 * Build a deeplink URL to return to a chat session after OAuth.
 * Returns undefined if session context is incomplete.
 */
export function buildOAuthDeeplinkUrl(ctx) {
    if (!ctx?.sessionId || !ctx?.deeplinkScheme)
        return undefined;
    return `${ctx.deeplinkScheme}://allSessions/session/${ctx.sessionId}`;
}
//# sourceMappingURL=types.js.map