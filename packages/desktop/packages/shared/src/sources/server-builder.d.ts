/**
 * SourceServerBuilder
 *
 * Builds MCP and API server configurations from LoadedSource objects.
 * This module handles URL normalization and server config creation,
 * but does NOT fetch credentials - credentials are passed in.
 *
 * This replaces SourceService's server building logic with a cleaner
 * separation of concerns:
 * - SourceCredentialManager: handles credentials
 * - SourceServerBuilder: handles server configuration
 */
import type { LoadedSource, ApiConfig } from './types.ts';
import { type ApiCredential } from './credential-manager.ts';
import { type SummarizeCallback } from './api-tools.ts';
import { createLocalMcpServer } from '../mcp/local-tools.ts';
/**
 * Standard error messages for server build failures.
 * Use these constants instead of string literals to ensure consistent matching.
 */
export declare const SERVER_BUILD_ERRORS: {
    readonly AUTH_REQUIRED: "Authentication required";
    readonly CREDENTIALS_NEEDED: "Credentials needed";
};
/**
 * MCP server configuration used by Qwen and the source pool.
 * Supports HTTP/SSE (remote) and stdio (local subprocess) transports.
 */
export type McpServerConfig = {
    type: 'http' | 'sse';
    url: string;
    headers?: Record<string, string>;
} | {
    type: 'stdio';
    command: string;
    args?: string[];
    env?: Record<string, string>;
};
/**
 * Source with its credential pre-loaded
 */
export interface SourceWithCredential {
    source: LoadedSource;
    /** Token for MCP sources, or ApiCredential for API sources */
    token?: string | null;
    credential?: ApiCredential | null;
}
/**
 * Result of building servers from sources
 */
export interface BuiltServers {
    /** MCP server configs keyed by source slug */
    mcpServers: Record<string, McpServerConfig>;
    /** In-process API servers keyed by source slug */
    apiServers: Record<string, ReturnType<typeof createLocalMcpServer>>;
    /** Sources that failed to build (missing auth, etc.) */
    errors: Array<{
        sourceSlug: string;
        error: string;
    }>;
}
/**
 * SourceServerBuilder - builds server configs from sources
 *
 * Usage:
 * ```typescript
 * const builder = new SourceServerBuilder();
 *
 * // Build MCP server config
 * const mcpConfig = builder.buildMcpServer(source, token);
 *
 * // Build all servers from sources with credentials
 * const { mcpServers, apiServers, errors } = await builder.buildAll([
 *   { source, token: 'abc123' },
 *   { source: apiSource, credential: 'api-key' },
 * ]);
 * ```
 */
export declare class SourceServerBuilder {
    /**
     * Build MCP server config from a source
     *
     * @param source - The source configuration
     * @param token - Authentication token (null for public/stdio sources)
     * @param credential - Multi-header credential from credential store (null if not set)
     */
    buildMcpServer(source: LoadedSource, token: string | null, credential?: ApiCredential | null): McpServerConfig | null;
    /**
     * Build API server from a source
     *
     * @param source - The source configuration
     * @param credential - API credential (null for public APIs)
     * @param getToken - Token getter for OAuth APIs (Google, etc.) - supports auto-refresh
     * @param sessionPath - Optional path to session folder for saving large responses
     */
    buildApiServer(source: LoadedSource, credential: ApiCredential | null, getToken?: () => Promise<string>, sessionPath?: string, summarize?: SummarizeCallback): Promise<ReturnType<typeof createLocalMcpServer> | null>;
    /**
     * Build ApiConfig from a LoadedSource
     */
    buildApiConfig(source: LoadedSource): ApiConfig;
    /**
     * Build all MCP and API servers for enabled sources
     *
     * @param sourcesWithCredentials - Sources with their pre-loaded credentials
     * @param getTokenForSource - Function to get token getter for OAuth sources
     * @param sessionPath - Optional path to session folder for saving large API responses
     */
    buildAll(sourcesWithCredentials: SourceWithCredential[], getTokenForSource?: (source: LoadedSource) => (() => Promise<string>) | undefined, sessionPath?: string, summarize?: SummarizeCallback): Promise<BuiltServers>;
}
/**
 * Normalize MCP URL to standard format
 * - Removes trailing slashes from the path portion only
 * - Preserves query strings and fragments unchanged
 * - Preserves the user-configured path as-is (no /mcp suffix appended)
 */
export declare function normalizeMcpUrl(url: string): string;
/**
 * Get shared SourceServerBuilder instance
 */
export declare function getSourceServerBuilder(): SourceServerBuilder;
