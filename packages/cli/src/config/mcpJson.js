/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { normalizeClaudeMcpServer, } from '@qwen-code/qwen-code-core';
import stripJsonComments from 'strip-json-comments';
/** Project-scoped MCP config filename, read from the workspace root. */
export const PROJECT_MCP_FILENAME = '.mcp.json';
/**
 * Load project-scoped MCP servers from `<projectRoot>/.mcp.json`.
 *
 * This is a pure read: it parses JSON and tags each server with
 * `scope: 'project'` so the discovery layer can gate it behind approval. It
 * never spawns a process, opens a transport, or runs a health check. A missing
 * file is normal (returns empty); a malformed file is reported via `errors` and
 * otherwise ignored so it can never crash startup.
 */
export function loadProjectMcpServers(projectRoot) {
    const filePath = path.join(projectRoot, PROJECT_MCP_FILENAME);
    let raw;
    try {
        raw = fs.readFileSync(filePath, 'utf-8');
    }
    catch {
        // Missing/unreadable file is the common case — not an error.
        return { servers: {}, path: undefined, errors: [] };
    }
    let parsed;
    try {
        parsed = JSON.parse(stripJsonComments(raw));
    }
    catch (e) {
        return {
            servers: {},
            path: filePath,
            errors: [`Failed to parse ${filePath}: ${e.message}`],
        };
    }
    const mcpServers = parsed?.mcpServers;
    if (!mcpServers ||
        typeof mcpServers !== 'object' ||
        Array.isArray(mcpServers)) {
        return {
            servers: {},
            path: filePath,
            errors: [`${filePath} has no "mcpServers" object`],
        };
    }
    const servers = Object.create(null);
    const errors = [];
    for (const [name, value] of Object.entries(mcpServers)) {
        if (!value || typeof value !== 'object' || Array.isArray(value)) {
            errors.push(`${filePath}: server "${name}" is not an object — skipped`);
            continue;
        }
        // `.mcp.json` is the Claude Code convention, so entries may use Claude's
        // `type`-based transport shape; normalize them to Qwen's field-based shape.
        servers[name] = {
            ...normalizeClaudeMcpServer(value),
            scope: 'project',
        };
    }
    return { servers, path: filePath, errors };
}
//# sourceMappingURL=mcpJson.js.map