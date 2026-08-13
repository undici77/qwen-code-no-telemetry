/**
 * Session Tools Core - Source Helpers
 *
 * Utilities for loading and working with source configurations.
 * These are standalone functions that don't depend on the full
 * packages/shared infrastructure.
 */
import type { SourceConfig } from './types.ts';
export declare const SOURCE_SLUG_REGEX: RegExp;
export declare function assertValidSourceSlug(sourceSlug: string): void;
/**
 * Get the path to a source's directory
 */
export declare function getSourcePath(workspaceRootPath: string, sourceSlug: string): string;
/**
 * Get the path to a source's config.json
 */
export declare function getSourceConfigPath(workspaceRootPath: string, sourceSlug: string): string;
/**
 * Get the path to a source's guide.md
 */
export declare function getSourceGuidePath(workspaceRootPath: string, sourceSlug: string): string;
/**
 * Check if a source directory exists
 */
export declare function sourceExists(workspaceRootPath: string, sourceSlug: string): boolean;
/**
 * Check if a source config file exists
 */
export declare function sourceConfigExists(workspaceRootPath: string, sourceSlug: string): boolean;
/**
 * Load a source configuration from disk.
 * Returns null if the config doesn't exist or is invalid.
 */
export declare function loadSourceConfig(workspaceRootPath: string, sourceSlug: string): SourceConfig | null;
/**
 * List all source slugs in a workspace
 */
export declare function listSourceSlugs(workspaceRootPath: string): string[];
/**
 * Get the path to a skill's directory
 */
export declare function getSkillPath(workspaceRootPath: string, skillSlug: string): string;
/**
 * Get the path to a skill's SKILL.md file
 */
export declare function getSkillMdPath(workspaceRootPath: string, skillSlug: string): string;
/**
 * Check if a skill directory exists
 */
export declare function skillExists(workspaceRootPath: string, skillSlug: string): boolean;
/**
 * Check if a skill's SKILL.md file exists
 */
export declare function skillMdExists(workspaceRootPath: string, skillSlug: string): boolean;
/**
 * List all skill slugs in a workspace
 */
export declare function listSkillSlugs(workspaceRootPath: string): string[];
/**
 * Read the session's workingDirectory from the persisted session.jsonl header.
 * Returns undefined if the session file doesn't exist, can't be parsed,
 * or has no workingDirectory set. Never throws.
 */
export declare function resolveSessionWorkingDirectory(workspacePath: string, sessionId: string): string | undefined;
/**
 * Generate a unique request ID for auth requests
 */
export declare function generateRequestId(prefix?: string): string;
import type { CredentialInputMode } from './types.ts';
export type { CredentialInputMode } from './types.ts';
/**
 * Detect the effective credential input mode based on source config and requested mode.
 *
 * Auto-upgrades to 'multi-header' when source has headerNames array, regardless of
 * what mode was explicitly requested. This ensures Datadog-like sources (with
 * headerNames: ["DD-API-KEY", "DD-APPLICATION-KEY"]) always use multi-header UI.
 *
 * @param source - Source configuration (may be null if source not found)
 * @param requestedMode - Mode explicitly requested in tool call
 * @param requestedHeaderNames - Header names explicitly provided in tool call
 * @returns Effective mode to use
 */
export declare function detectCredentialMode(source: {
    api?: {
        headerNames?: string[];
    };
    mcp?: {
        headerNames?: string[];
    };
} | null, requestedMode: CredentialInputMode, requestedHeaderNames?: string[]): CredentialInputMode;
/**
 * Get effective header names from request args or source config.
 *
 * @param source - Source configuration
 * @param requestedHeaderNames - Header names explicitly provided in tool call
 * @returns Array of header names or undefined
 */
export declare function getEffectiveHeaderNames(source: {
    api?: {
        headerNames?: string[];
    };
    mcp?: {
        headerNames?: string[];
    };
} | null, requestedHeaderNames?: string[]): string[] | undefined;
