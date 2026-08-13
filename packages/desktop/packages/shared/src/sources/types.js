/**
 * Source Types
 *
 * Sources are external data connections (MCP servers, APIs, local filesystems).
 * They replace the old "connections" concept with a more flexible, folder-based architecture.
 *
 * File structure:
 * ~/.craft-agent/workspaces/{workspaceId}/sources/{sourceSlug}/
 *   ├── config.json   - Source settings
 *   └── guide.md      - Usage guidelines + cached data (in YAML frontmatter)
 */
/**
 * Infer Google service from API baseUrl.
 * Returns undefined if URL doesn't match a known Google API pattern.
 *
 * Uses proper URL parsing to avoid false positives from arbitrary path matching.
 */
export function inferGoogleServiceFromUrl(baseUrl) {
    if (!baseUrl)
        return undefined;
    let hostname;
    let pathname;
    try {
        const parsed = new URL(baseUrl);
        hostname = parsed.hostname.toLowerCase();
        pathname = parsed.pathname.toLowerCase();
    }
    catch {
        return undefined;
    }
    // Match by hostname (most reliable)
    if (hostname === 'calendar.googleapis.com')
        return 'calendar';
    if (hostname === 'drive.googleapis.com')
        return 'drive';
    if (hostname === 'gmail.googleapis.com')
        return 'gmail';
    if (hostname === 'docs.googleapis.com')
        return 'docs';
    if (hostname === 'sheets.googleapis.com')
        return 'sheets';
    if (hostname === 'youtube.googleapis.com')
        return 'youtube';
    if (hostname === 'searchconsole.googleapis.com' || hostname === 'webmasters.googleapis.com')
        return 'searchconsole';
    // Fallback: check path patterns only on googleapis.com domains
    if (hostname === 'www.googleapis.com' || hostname === 'googleapis.com') {
        if (pathname.startsWith('/calendar/'))
            return 'calendar';
        if (pathname.startsWith('/drive/'))
            return 'drive';
        if (pathname.startsWith('/gmail/'))
            return 'gmail';
        if (pathname.startsWith('/v1/documents') || pathname.startsWith('/documents/'))
            return 'docs';
        if (pathname.startsWith('/v4/spreadsheets') || pathname.startsWith('/spreadsheets/'))
            return 'sheets';
        if (pathname.startsWith('/youtube/'))
            return 'youtube';
        if (pathname.startsWith('/webmasters/'))
            return 'searchconsole';
    }
    return undefined;
}
/**
 * Infer Slack service from API baseUrl.
 * Returns 'full' by default if URL matches Slack API pattern.
 */
export function inferSlackServiceFromUrl(baseUrl) {
    if (!baseUrl)
        return undefined;
    let hostname;
    try {
        const parsed = new URL(baseUrl);
        hostname = parsed.hostname.toLowerCase();
    }
    catch {
        return undefined;
    }
    // Match Slack API hostname
    if (hostname === 'slack.com' || hostname === 'api.slack.com') {
        return 'full'; // Default to full service for Slack
    }
    return undefined;
}
/**
 * Infer Microsoft service from API baseUrl.
 * Microsoft Graph API uses graph.microsoft.com for all services.
 * Returns undefined if service cannot be determined from URL path.
 */
export function inferMicrosoftServiceFromUrl(baseUrl) {
    if (!baseUrl)
        return undefined;
    let hostname;
    let pathname;
    try {
        const parsed = new URL(baseUrl);
        hostname = parsed.hostname.toLowerCase();
        pathname = parsed.pathname.toLowerCase();
    }
    catch {
        return undefined;
    }
    // Match Microsoft Graph API hostname
    if (hostname === 'graph.microsoft.com') {
        // Try to infer service from path
        if (pathname.includes('/me/messages') || pathname.includes('/me/mailfolders') || pathname.includes('/mail')) {
            return 'outlook';
        }
        if (pathname.includes('/me/calendar') || pathname.includes('/me/events')) {
            return 'microsoft-calendar';
        }
        if (pathname.includes('/me/drive') || pathname.includes('/drives')) {
            return 'onedrive';
        }
        if (pathname.includes('/teams') || pathname.includes('/chats')) {
            return 'teams';
        }
        if (pathname.includes('/sites')) {
            return 'sharepoint';
        }
        // Cannot determine service from generic Graph URL - require explicit microsoftService config
        return undefined;
    }
    // Match Outlook-specific API (legacy, but still used)
    if (hostname === 'outlook.office.com' || hostname === 'outlook.office365.com') {
        return 'outlook';
    }
    return undefined;
}
/**
 * API providers that use OAuth for authentication.
 * These providers store credentials as source_oauth and use SourceCredentialManager.
 */
export const API_OAUTH_PROVIDERS = ['google', 'microsoft', 'slack'];
/**
 * Check if a provider uses OAuth for API authentication
 */
export function isApiOAuthProvider(provider) {
    return API_OAUTH_PROVIDERS.includes(provider);
}
/**
 * Check if a source uses OAuth authentication (for proactive token refresh).
 *
 * Returns true for:
 * - MCP sources with authType: 'oauth'
 * - API sources with OAuth providers (google, slack, microsoft)
 */
export function isOAuthSource(source) {
    // MCP OAuth sources
    if (source.config.type === 'mcp') {
        return source.config.mcp?.authType === 'oauth';
    }
    // API OAuth sources (Google, Slack, Microsoft)
    if (source.config.type === 'api') {
        if (isApiOAuthProvider(source.config.provider))
            return true;
        // Generic OAuth API sources (e.g. GitHub, Linear)
        if (isGenericOAuthSource(source))
            return true;
    }
    return false;
}
/**
 * Check if a source uses generic OAuth (not Google/Slack/Microsoft provider-specific).
 * Matches API sources with authType 'oauth' — either explicit oauth config block
 * or auto-discovery from baseUrl via RFC 9728/8414.
 */
export function isGenericOAuthSource(source) {
    return (source.config.type === 'api' &&
        source.config.api?.authType === 'oauth' &&
        !isApiOAuthProvider(source.config.provider));
}
/**
 * Check if an API source has a token renew endpoint configured.
 */
export function hasRenewEndpoint(source) {
    return source.config.type === 'api' && !!source.config.api?.renewEndpoint?.path;
}
/**
 * Check if a source can auto-refresh its token.
 * Returns true for OAuth sources OR sources with a renewEndpoint.
 *
 * Use this as the single guard for "can this source refresh?" instead of
 * sprinkling provider/authType/renewEndpoint checks in multiple places.
 */
export function isRefreshableSource(source) {
    return isOAuthSource(source) || hasRenewEndpoint(source);
}
//# sourceMappingURL=types.js.map