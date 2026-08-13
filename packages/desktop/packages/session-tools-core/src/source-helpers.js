/**
 * Session Tools Core - Source Helpers
 *
 * Utilities for loading and working with source configurations.
 * These are standalone functions that don't depend on the full
 * packages/shared infrastructure.
 */
import { existsSync, readFileSync, readdirSync, statSync, openSync, readSync, closeSync } from 'node:fs';
import { join } from 'node:path';
// Keep in sync with shared/src/config/validators.ts - session-tools-core cannot import from shared.
export const SOURCE_SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export function assertValidSourceSlug(sourceSlug) {
    if (!SOURCE_SLUG_REGEX.test(sourceSlug)) {
        throw new Error(`Invalid source slug: ${JSON.stringify(sourceSlug)}`);
    }
}
/** Strip UTF-8 BOM that breaks JSON.parse */
function stripBom(text) {
    return text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text;
}
/**
 * Get the path to a source's directory
 */
export function getSourcePath(workspaceRootPath, sourceSlug) {
    assertValidSourceSlug(sourceSlug);
    return join(workspaceRootPath, 'sources', sourceSlug);
}
/**
 * Get the path to a source's config.json
 */
export function getSourceConfigPath(workspaceRootPath, sourceSlug) {
    return join(getSourcePath(workspaceRootPath, sourceSlug), 'config.json');
}
/**
 * Get the path to a source's guide.md
 */
export function getSourceGuidePath(workspaceRootPath, sourceSlug) {
    return join(getSourcePath(workspaceRootPath, sourceSlug), 'guide.md');
}
/**
 * Check if a source directory exists
 */
export function sourceExists(workspaceRootPath, sourceSlug) {
    try {
        return existsSync(getSourcePath(workspaceRootPath, sourceSlug));
    }
    catch {
        return false;
    }
}
/**
 * Check if a source config file exists
 */
export function sourceConfigExists(workspaceRootPath, sourceSlug) {
    try {
        return existsSync(getSourceConfigPath(workspaceRootPath, sourceSlug));
    }
    catch {
        return false;
    }
}
/**
 * Load a source configuration from disk.
 * Returns null if the config doesn't exist or is invalid.
 */
export function loadSourceConfig(workspaceRootPath, sourceSlug) {
    try {
        const configPath = getSourceConfigPath(workspaceRootPath, sourceSlug);
        if (!existsSync(configPath)) {
            return null;
        }
        const content = readFileSync(configPath, 'utf-8');
        const config = JSON.parse(stripBom(content));
        return config;
    }
    catch {
        return null;
    }
}
/**
 * List all source slugs in a workspace
 */
export function listSourceSlugs(workspaceRootPath) {
    const sourcesDir = join(workspaceRootPath, 'sources');
    if (!existsSync(sourcesDir)) {
        return [];
    }
    try {
        const entries = readdirSync(sourcesDir);
        return entries.filter((entry) => {
            const entryPath = join(sourcesDir, entry);
            return statSync(entryPath).isDirectory();
        });
    }
    catch {
        return [];
    }
}
/**
 * Get the path to a skill's directory
 */
export function getSkillPath(workspaceRootPath, skillSlug) {
    return join(workspaceRootPath, 'skills', skillSlug);
}
/**
 * Get the path to a skill's SKILL.md file
 */
export function getSkillMdPath(workspaceRootPath, skillSlug) {
    return join(getSkillPath(workspaceRootPath, skillSlug), 'SKILL.md');
}
/**
 * Check if a skill directory exists
 */
export function skillExists(workspaceRootPath, skillSlug) {
    return existsSync(getSkillPath(workspaceRootPath, skillSlug));
}
/**
 * Check if a skill's SKILL.md file exists
 */
export function skillMdExists(workspaceRootPath, skillSlug) {
    return existsSync(getSkillMdPath(workspaceRootPath, skillSlug));
}
/**
 * List all skill slugs in a workspace
 */
export function listSkillSlugs(workspaceRootPath) {
    const skillsDir = join(workspaceRootPath, 'skills');
    if (!existsSync(skillsDir)) {
        return [];
    }
    try {
        const entries = readdirSync(skillsDir);
        return entries.filter((entry) => {
            const entryPath = join(skillsDir, entry);
            return statSync(entryPath).isDirectory();
        });
    }
    catch {
        return [];
    }
}
// ============================================================
// Session State Helpers
// ============================================================
/**
 * Read the session's workingDirectory from the persisted session.jsonl header.
 * Returns undefined if the session file doesn't exist, can't be parsed,
 * or has no workingDirectory set. Never throws.
 */
export function resolveSessionWorkingDirectory(workspacePath, sessionId) {
    try {
        const sessionFile = join(workspacePath, 'sessions', sessionId, 'session.jsonl');
        if (!existsSync(sessionFile))
            return undefined;
        // Read first line only (header) — 8KB buffer is plenty
        const fd = openSync(sessionFile, 'r');
        try {
            const buffer = Buffer.alloc(8192);
            const bytesRead = readSync(fd, buffer, 0, 8192, 0);
            const firstLine = buffer.toString('utf-8', 0, bytesRead).split('\n')[0] ?? '';
            const header = JSON.parse(firstLine);
            return header.workingDirectory || undefined;
        }
        finally {
            closeSync(fd);
        }
    }
    catch {
        return undefined; // Never fail — caller handles missing gracefully
    }
}
/**
 * Generate a unique request ID for auth requests
 */
export function generateRequestId(prefix = 'req') {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
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
export function detectCredentialMode(source, requestedMode, requestedHeaderNames) {
    // Use provided headerNames or fall back to source config (API or MCP)
    const effectiveHeaderNames = requestedHeaderNames || source?.api?.headerNames || source?.mcp?.headerNames;
    // If we have headerNames, always use multi-header mode
    if (effectiveHeaderNames && effectiveHeaderNames.length > 0) {
        return 'multi-header';
    }
    return requestedMode;
}
/**
 * Get effective header names from request args or source config.
 *
 * @param source - Source configuration
 * @param requestedHeaderNames - Header names explicitly provided in tool call
 * @returns Array of header names or undefined
 */
export function getEffectiveHeaderNames(source, requestedHeaderNames) {
    return requestedHeaderNames || source?.api?.headerNames || source?.mcp?.headerNames;
}
//# sourceMappingURL=source-helpers.js.map