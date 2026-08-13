/**
 * Sources Module
 *
 * Public exports for source management.
 */
// Constants and helpers
export { API_OAUTH_PROVIDERS, isApiOAuthProvider, isGenericOAuthSource, hasRenewEndpoint, isRefreshableSource, } from './types.ts';
// Storage functions
export { 
// Directory utilities
ensureSourcesDir, getSourcePath, 
// Config operations
loadSourceConfig, saveSourceConfig, markSourceAuthenticated, 
// Guide operations
loadSourceGuide, saveSourceGuide, 
// Icon operations
findSourceIcon, downloadSourceIcon, sourceNeedsIconDownload, isIconUrl, 
// Load operations
loadSource, loadWorkspaceSources, loadAllSources, getEnabledSources, isSourceUsable, getSourcesBySlugs, 
// Create/Delete operations
generateSourceSlug, createSource, deleteSource, sourceExists, 
// Parsing utilities
parseGuideMarkdown, } from './storage.ts';
// Credential Manager (unified credential operations)
export { SourceCredentialManager, getSourceCredentialManager, getSourcesNeedingAuth, } from './credential-manager.ts';
// Server Builder (builds MCP/API servers from sources)
export { SourceServerBuilder, getSourceServerBuilder, normalizeMcpUrl, SERVER_BUILD_ERRORS, } from './server-builder.ts';
// Built-in Sources (always available in every workspace)
export { getDocsSource, getBuiltinSources, isBuiltinSource, } from './builtin-sources.ts';
// Token Refresh Manager (handles OAuth token refresh with rate limiting)
export { TokenRefreshManager, createTokenGetter, } from './token-refresh-manager.ts';
//# sourceMappingURL=index.js.map