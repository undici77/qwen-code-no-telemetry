/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { loadSettings } from '../../config/settings.js';
import { writeStdoutLine, writeStderrLine } from '../../utils/stdioHelpers.js';
import { Config, FileDiscoveryService, ExtensionManager, } from '@qwen-code/qwen-code-core';
import { isWorkspaceTrusted } from '../../config/trustedFolders.js';
import { getPendingGatedMcpServers } from '../../config/mcpApprovals.js';
import { assembleMcpServers } from '../../config/mcpServers.js';
import { getCurrentLanguage } from '../../i18n/index.js';
async function getMcpServersFromConfig(extensionManager) {
    const settings = loadSettings();
    const extManager = extensionManager ??
        new ExtensionManager({
            isWorkspaceTrusted: isWorkspaceTrusted(settings.merged).isTrusted ?? true,
            telemetrySettings: settings.merged.telemetry,
            locale: getCurrentLanguage(),
        });
    if (!extensionManager) {
        await extManager.refreshCache();
    }
    const extensions = extManager.getLoadedExtensions();
    const mcpServers = assembleMcpServers(settings.merged.mcpServers, process.cwd());
    for (const extension of extensions) {
        if (extension.isActive) {
            Object.entries(extension.config.mcpServers || {}).forEach(([key, server]) => {
                if (mcpServers[key]) {
                    return;
                }
                mcpServers[key] = {
                    ...server,
                    extensionName: extension.config.name,
                };
            });
        }
    }
    return mcpServers;
}
async function createMinimalConfig() {
    const settings = loadSettings();
    const cwd = process.cwd();
    const fileFiltering = settings.merged.context?.fileFiltering;
    const fileService = new FileDiscoveryService(cwd, fileFiltering?.customIgnoreFiles);
    const mcpServers = await getMcpServersFromConfig();
    const config = new Config({
        sessionId: 'mcp-reconnect',
        targetDir: cwd,
        cwd,
        debugMode: false,
        chatRecording: false,
        mcpServers,
        pendingMcpServers: getPendingGatedMcpServers(mcpServers, cwd),
        fileDiscoveryService: fileService,
        mcpServerCommand: settings.merged.mcp?.serverCommand,
        ...(fileFiltering !== undefined ? { fileFiltering } : {}),
    });
    await config.initialize();
    return config;
}
function createReconnectError(message, exitCode = 1) {
    const error = new Error(message);
    error.exitCode = exitCode;
    return error;
}
async function reconnectMcpServer(serverName) {
    const mcpServers = await getMcpServersFromConfig();
    if (!mcpServers[serverName]) {
        throw createReconnectError(`Error: Server "${serverName}" not found in configuration.`);
    }
    writeStdoutLine(`Reconnecting to server "${serverName}"...`);
    try {
        const config = await createMinimalConfig();
        const toolRegistry = config.getToolRegistry();
        await toolRegistry.discoverToolsForServer(serverName);
        writeStdoutLine(`Successfully reconnected to server "${serverName}".`);
        await config.shutdown();
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw createReconnectError(`Failed to reconnect to server "${serverName}": ${message}`);
    }
}
async function reconnectAllMcpServers() {
    const settings = loadSettings();
    const extensionManager = new ExtensionManager({
        isWorkspaceTrusted: isWorkspaceTrusted(settings.merged).isTrusted ?? true,
        telemetrySettings: settings.merged.telemetry,
        locale: getCurrentLanguage(),
    });
    await extensionManager.refreshCache();
    const mcpServers = await getMcpServersFromConfig(extensionManager);
    const serverNames = Object.keys(mcpServers);
    if (serverNames.length === 0) {
        writeStdoutLine('No MCP servers configured.');
        return;
    }
    writeStdoutLine('Reconnecting to all MCP servers...\n');
    let config;
    try {
        config = await createMinimalConfig();
        const toolRegistry = config.getToolRegistry();
        for (const serverName of serverNames) {
            try {
                await toolRegistry.discoverToolsForServer(serverName);
                writeStdoutLine(`✓ ${serverName}: Reconnected successfully`);
            }
            catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                writeStdoutLine(`✗ ${serverName}: Failed - ${message}`);
            }
        }
    }
    finally {
        if (config) {
            await config.shutdown();
        }
    }
}
export const reconnectCommand = {
    command: 'reconnect [server-name]',
    describe: 'Reconnect MCP server(s)',
    builder: (yargs) => yargs
        .usage('Usage: qwen mcp reconnect [options] [server-name]')
        .positional('server-name', {
        describe: 'Name of the server to reconnect',
        type: 'string',
    })
        .option('all', {
        alias: 'a',
        describe: 'Reconnect all configured servers',
        type: 'boolean',
        default: false,
    })
        .conflicts('server-name', 'all')
        .check((argv) => {
        const serverName = argv['server-name'];
        const all = argv['all'];
        if (!serverName && !all) {
            throw new Error('Please specify a server name or use --all to reconnect all servers.');
        }
        return true;
    }),
    handler: async (argv) => {
        const serverName = argv['server-name'];
        const all = argv['all'];
        try {
            if (all) {
                await reconnectAllMcpServers();
            }
            else if (serverName) {
                await reconnectMcpServer(serverName);
            }
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            const exitCode = error?.exitCode ?? 1;
            writeStderrLine(message);
            process.exit(exitCode);
        }
    },
};
//# sourceMappingURL=reconnect.js.map