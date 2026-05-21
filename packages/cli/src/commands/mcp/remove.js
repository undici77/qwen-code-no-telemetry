/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { loadSettings, SettingScope } from '../../config/settings.js';
import { writeStdoutLine } from '../../utils/stdioHelpers.js';
import { MCPOAuthTokenStorage } from '@qwen-code/qwen-code-core';
async function removeMcpServer(name, options) {
    const { scope } = options;
    const settingsScope = scope === 'user' ? SettingScope.User : SettingScope.Workspace;
    const settings = loadSettings();
    const existingSettings = settings.forScope(settingsScope).settings;
    const mcpServers = existingSettings.mcpServers || {};
    if (!mcpServers[name]) {
        writeStdoutLine(`Server "${name}" not found in ${scope} settings.`);
        return;
    }
    delete mcpServers[name];
    settings.setValue(settingsScope, 'mcpServers', mcpServers);
    // Clean up any stored OAuth tokens for this server
    try {
        const tokenStorage = new MCPOAuthTokenStorage();
        await tokenStorage.deleteCredentials(name);
    }
    catch {
        // Token cleanup is best-effort; don't fail the remove operation
    }
    writeStdoutLine(`Server "${name}" removed from ${scope} settings.`);
}
export const removeCommand = {
    command: 'remove <name>',
    describe: 'Remove a server',
    builder: (yargs) => yargs
        .usage('Usage: qwen mcp remove [options] <name>')
        .positional('name', {
        describe: 'Name of the server',
        type: 'string',
        demandOption: true,
    })
        .option('scope', {
        alias: 's',
        describe: 'Configuration scope (user or project)',
        type: 'string',
        default: 'user',
        choices: ['user', 'project'],
    }),
    handler: async (argv) => {
        await removeMcpServer(argv['name'], {
            scope: argv['scope'],
        });
    },
};
//# sourceMappingURL=remove.js.map