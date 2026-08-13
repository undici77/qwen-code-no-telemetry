/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { normalizeClaudeMcpServer, } from '@qwen-code/qwen-code-core';
import stripJsonComments from 'strip-json-comments';
import { SettingScope } from './settings.js';
function isRecord(value) {
    return !!value && typeof value === 'object' && !Array.isArray(value);
}
function isReadableConfigError(error) {
    return !!error && typeof error === 'object' && 'code' in error;
}
function isReservedServerName(name) {
    return name === '__proto__' || name === 'constructor' || name === 'prototype';
}
function emptyServerRecord() {
    return Object.create(null);
}
function readJsonObject(filePath) {
    let raw;
    try {
        raw = fs.readFileSync(filePath, 'utf-8');
    }
    catch (error) {
        if (isReadableConfigError(error) &&
            (error.code === 'ENOENT' || error.code === 'ENOTDIR')) {
            return { found: false };
        }
        return {
            found: true,
            error: `Failed to read ${filePath}: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
    if (!raw.trim()) {
        return { found: false };
    }
    let parsed;
    try {
        parsed = JSON.parse(stripJsonComments(raw));
    }
    catch (error) {
        return {
            found: true,
            error: `Failed to parse ${filePath}: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
    if (!isRecord(parsed)) {
        return {
            found: true,
            error: `${filePath} must contain a JSON object`,
        };
    }
    return { found: true, data: parsed };
}
function copyMcpServers(value, sourcePath, servers, errors) {
    if (value === undefined) {
        return;
    }
    if (!isRecord(value)) {
        errors.push(`${sourcePath} has no "mcpServers" object`);
        return;
    }
    for (const [name, serverConfig] of Object.entries(value)) {
        if (!isRecord(serverConfig)) {
            errors.push(`${sourcePath}: server "${name}" is not an object - skipped`);
            continue;
        }
        // Claude keys transport off a `type` field; Qwen keys off which URL field is
        // set. Normalize so a Claude `type: 'http'` server connects over streamable
        // HTTP instead of being mistaken for SSE.
        servers[name] = normalizeClaudeMcpServer(serverConfig);
    }
}
function normalizeProjectPath(projectPath) {
    return path.resolve(projectPath);
}
function getClaudeProjectSettings(projects, cwd) {
    if (!isRecord(projects)) {
        return undefined;
    }
    const normalizedCwd = normalizeProjectPath(cwd);
    for (const [projectPath, projectSettings] of Object.entries(projects)) {
        if (normalizeProjectPath(projectPath) === normalizedCwd &&
            isRecord(projectSettings)) {
            return projectSettings;
        }
    }
    return undefined;
}
export function getClaudeCodeConfigPath(homeDir = os.homedir()) {
    return path.join(homeDir, '.claude.json');
}
export function getClaudeDesktopConfigPath(homeDir = os.homedir(), platform = process.platform, env = process.env) {
    if (platform === 'win32') {
        const appData = env['APPDATA'] ?? path.win32.join(homeDir, 'AppData', 'Roaming');
        return path.win32.join(appData, 'Claude', 'claude_desktop_config.json');
    }
    if (platform === 'darwin') {
        return path.join(homeDir, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
    }
    return path.join(homeDir, '.config', 'Claude', 'claude_desktop_config.json');
}
function loadMcpServersFromSettingsFile(filePath, label, source) {
    const errors = [];
    const servers = emptyServerRecord();
    const parsed = readJsonObject(filePath);
    if (!parsed.found) {
        return {
            source,
            label,
            path: filePath,
            servers,
            errors,
            found: false,
        };
    }
    if (!parsed.data) {
        return {
            source,
            label,
            path: filePath,
            servers,
            errors: parsed.error ? [parsed.error] : errors,
            found: true,
        };
    }
    copyMcpServers(parsed.data['mcpServers'], filePath, servers, errors);
    return {
        source,
        label,
        path: filePath,
        servers,
        errors,
        found: true,
    };
}
function loadClaudeCodeJsonMcpServers(homeDir, cwd, scope) {
    const filePath = getClaudeCodeConfigPath(homeDir);
    const errors = [];
    const servers = emptyServerRecord();
    const parsed = readJsonObject(filePath);
    if (!parsed.found) {
        return {
            source: 'claude-code',
            label: 'Claude Code',
            path: filePath,
            servers,
            errors,
            found: false,
        };
    }
    if (!parsed.data) {
        return {
            source: 'claude-code',
            label: 'Claude Code',
            path: filePath,
            servers,
            errors: parsed.error ? [parsed.error] : errors,
            found: true,
        };
    }
    if (scope === 'user') {
        copyMcpServers(parsed.data['mcpServers'], filePath, servers, errors);
    }
    else {
        const projectSettings = getClaudeProjectSettings(parsed.data['projects'], cwd);
        if (projectSettings) {
            copyMcpServers(projectSettings['mcpServers'], `${filePath} projects["${normalizeProjectPath(cwd)}"]`, servers, errors);
        }
    }
    return {
        source: 'claude-code',
        label: 'Claude Code',
        path: filePath,
        servers,
        errors,
        found: true,
    };
}
function loadClaudeCodeMcpSources(homeDir, cwd, scope) {
    const candidates = scope === 'project'
        ? [
            loadMcpServersFromSettingsFile(path.join(cwd, '.claude', 'settings.json'), 'Claude Code project settings', 'claude-code'),
            loadClaudeCodeJsonMcpServers(homeDir, cwd, scope),
        ]
        : [
            loadClaudeCodeJsonMcpServers(homeDir, cwd, scope),
            loadMcpServersFromSettingsFile(path.join(homeDir, '.claude', 'settings.json'), 'Claude Code global settings', 'claude-code'),
        ];
    const seen = new Set();
    return candidates.filter((candidate) => {
        if (seen.has(candidate.path)) {
            return false;
        }
        seen.add(candidate.path);
        return true;
    });
}
function loadClaudeDesktopMcpServers(homeDir, platform, env) {
    const filePath = getClaudeDesktopConfigPath(homeDir, platform, env);
    const errors = [];
    const servers = emptyServerRecord();
    const parsed = readJsonObject(filePath);
    if (!parsed.found) {
        return {
            source: 'claude-desktop',
            label: 'Claude Desktop',
            path: filePath,
            servers,
            errors,
            found: false,
        };
    }
    if (!parsed.data) {
        return {
            source: 'claude-desktop',
            label: 'Claude Desktop',
            path: filePath,
            servers,
            errors: parsed.error ? [parsed.error] : errors,
            found: true,
        };
    }
    copyMcpServers(parsed.data['mcpServers'], filePath, servers, errors);
    return {
        source: 'claude-desktop',
        label: 'Claude Desktop',
        path: filePath,
        servers,
        errors,
        found: true,
    };
}
export function loadClaudeMcpSources(options) {
    const homeDir = options.homeDir ?? os.homedir();
    const cwd = options.cwd ?? process.cwd();
    const platform = options.platform ?? process.platform;
    const env = options.env ?? process.env;
    const scope = options.scope ?? 'user';
    const sources = options.source === 'all'
        ? ['claude-code', 'claude-desktop']
        : [options.source];
    return sources.flatMap((source) => source === 'claude-code'
        ? loadClaudeCodeMcpSources(homeDir, cwd, scope)
        : [loadClaudeDesktopMcpServers(homeDir, platform, env)]);
}
function getSettingScope(settings, scope) {
    if (scope === 'user') {
        return SettingScope.User;
    }
    if (settings.workspace.path === settings.user.path) {
        throw new Error('Please use --scope user to edit settings in the home directory.');
    }
    return SettingScope.Workspace;
}
function addServerNamesFromRecord(value, names) {
    if (!isRecord(value)) {
        return;
    }
    for (const name of Object.keys(value)) {
        names.add(name);
    }
}
function copyExistingServers(settings, settingScope) {
    const existingServers = settings.forScope(settingScope).settings.mcpServers;
    const existingNames = new Set();
    if (existingServers === undefined) {
        addServerNamesFromRecord(settings.merged?.mcpServers, existingNames);
        return { nextServers: emptyServerRecord(), existingNames };
    }
    if (!isRecord(existingServers)) {
        throw new Error('Existing mcpServers setting must be an object.');
    }
    const copy = emptyServerRecord();
    for (const [name, serverConfig] of Object.entries(existingServers)) {
        copy[name] = serverConfig;
        existingNames.add(name);
    }
    addServerNamesFromRecord(settings.merged?.mcpServers, existingNames);
    return { nextServers: copy, existingNames };
}
export function importClaudeMcpServers(options) {
    const settingScope = getSettingScope(options.settings, options.scope);
    const { nextServers, existingNames } = copyExistingServers(options.settings, settingScope);
    const scanned = loadClaudeMcpSources(options);
    const imported = [];
    const skipped = [];
    const errors = scanned.flatMap((source) => source.errors);
    for (const source of scanned) {
        for (const [name, serverConfig] of Object.entries(source.servers)) {
            if (isReservedServerName(name)) {
                skipped.push({ name, source: source.label, reason: 'reserved-name' });
                continue;
            }
            if (existingNames.has(name)) {
                skipped.push({ name, source: source.label, reason: 'already-exists' });
                continue;
            }
            nextServers[name] = serverConfig;
            existingNames.add(name);
            imported.push({ name, source: source.label });
        }
    }
    if (imported.length > 0) {
        options.settings.setValue(settingScope, 'mcpServers', nextServers);
    }
    return {
        scope: options.scope,
        settingScope,
        scanned,
        imported,
        skipped,
        errors,
    };
}
//# sourceMappingURL=claudeMcpImport.js.map