/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { loadSettings, SettingScope } from '../../config/settings.js';
import { writeStdoutLine, writeStderrLine } from '../../utils/stdioHelpers.js';
async function addMcpServer(name, commandOrUrl, args, options) {
    const { scope, transport, env, header, timeout, trust, description, includeTools, excludeTools, oauthClientId, oauthClientSecret, oauthRedirectUri, oauthAuthorizationUrl, oauthTokenUrl, oauthScopes, } = options;
    const settings = loadSettings(process.cwd());
    const inHome = settings.workspace.path === settings.user.path;
    if (scope === 'project' && inHome) {
        writeStderrLine('Error: Please use --scope user to edit settings in the home directory.');
        process.exit(1);
    }
    const settingsScope = scope === 'user' ? SettingScope.User : SettingScope.Workspace;
    let newServer = {};
    const scopes = oauthScopes
        ?.flatMap((s) => s.split(','))
        .map((s) => s.trim())
        .filter(Boolean);
    const hasOAuth = Boolean(oauthClientId ||
        oauthClientSecret ||
        oauthRedirectUri ||
        oauthAuthorizationUrl ||
        oauthTokenUrl ||
        (scopes && scopes.length > 0));
    // OAuth only applies to remote HTTP/SSE transports. Reject mixing with stdio
    // so users don't silently persist unused configuration.
    if (hasOAuth && transport === 'stdio') {
        writeStderrLine('Error: OAuth options (--oauth-*) are only supported with --transport sse or --transport http.');
        process.exit(1);
    }
    const oauthConfig = hasOAuth
        ? {
            enabled: true,
            ...(oauthClientId && { clientId: oauthClientId }),
            ...(oauthClientSecret && { clientSecret: oauthClientSecret }),
            ...(oauthRedirectUri && { redirectUri: oauthRedirectUri }),
            ...(oauthAuthorizationUrl && {
                authorizationUrl: oauthAuthorizationUrl,
            }),
            ...(oauthTokenUrl && { tokenUrl: oauthTokenUrl }),
            ...(scopes && scopes.length > 0 && { scopes }),
        }
        : undefined;
    const headers = header?.reduce((acc, curr) => {
        const [key, ...valueParts] = curr.split(':');
        const value = valueParts.join(':').trim();
        if (key.trim() && value) {
            acc[key.trim()] = value;
        }
        return acc;
    }, {});
    switch (transport) {
        case 'sse':
            newServer = {
                url: commandOrUrl,
                headers,
                timeout,
                trust,
                description,
                includeTools,
                excludeTools,
                oauth: oauthConfig,
            };
            break;
        case 'http':
            newServer = {
                httpUrl: commandOrUrl,
                headers,
                timeout,
                trust,
                description,
                includeTools,
                excludeTools,
                oauth: oauthConfig,
            };
            break;
        case 'stdio':
        default:
            newServer = {
                command: commandOrUrl,
                args: args?.map(String),
                env: env?.reduce((acc, curr) => {
                    const [key, value] = curr.split('=');
                    if (key && value) {
                        acc[key] = value;
                    }
                    return acc;
                }, {}),
                timeout,
                trust,
                description,
                includeTools,
                excludeTools,
            };
            break;
    }
    const existingSettings = settings.forScope(settingsScope).settings;
    const mcpServers = existingSettings.mcpServers || {};
    const isExistingServer = !!mcpServers[name];
    if (isExistingServer) {
        writeStdoutLine(`MCP server "${name}" is already configured within ${scope} settings.`);
    }
    mcpServers[name] = newServer;
    settings.setValue(settingsScope, 'mcpServers', mcpServers);
    if (isExistingServer) {
        writeStdoutLine(`MCP server "${name}" updated in ${scope} settings.`);
    }
    else {
        writeStdoutLine(`MCP server "${name}" added to ${scope} settings. (${transport})`);
    }
}
export const addCommand = {
    command: 'add <name> <commandOrUrl> [args...]',
    describe: 'Add a server',
    builder: (yargs) => yargs
        .usage('Usage: qwen mcp add [options] <name> <commandOrUrl> [args...]')
        .parserConfiguration({
        'unknown-options-as-args': true, // Pass unknown options as server args
        'populate--': true, // Populate server args after -- separator
    })
        .positional('name', {
        describe: 'Name of the server',
        type: 'string',
        demandOption: true,
    })
        .positional('commandOrUrl', {
        describe: 'Command (stdio) or URL (sse, http)',
        type: 'string',
        demandOption: true,
    })
        .option('scope', {
        alias: 's',
        describe: 'Configuration scope (user or project)',
        type: 'string',
        default: 'user',
        choices: ['user', 'project'],
    })
        .option('transport', {
        alias: 't',
        describe: 'Transport type (stdio, sse, http). Auto-detected from URL if not specified.',
        type: 'string',
        choices: ['stdio', 'sse', 'http'],
    })
        .option('env', {
        alias: 'e',
        describe: 'Set environment variables (e.g. -e KEY=value)',
        type: 'array',
        string: true,
        nargs: 1,
    })
        .option('header', {
        alias: 'H',
        describe: 'Set HTTP headers for SSE and HTTP transports (e.g. -H "X-Api-Key: abc123" -H "Authorization: Bearer abc123")',
        type: 'array',
        string: true,
        nargs: 1,
    })
        .option('timeout', {
        describe: 'Set connection timeout in milliseconds',
        type: 'number',
    })
        .option('trust', {
        describe: 'Trust the server (bypass all tool call confirmation prompts)',
        type: 'boolean',
    })
        .option('description', {
        describe: 'Set the description for the server',
        type: 'string',
    })
        .option('include-tools', {
        describe: 'A comma-separated list of tools to include',
        type: 'array',
        string: true,
    })
        .option('exclude-tools', {
        describe: 'A comma-separated list of tools to exclude',
        type: 'array',
        string: true,
    })
        .option('oauth-client-id', {
        describe: 'OAuth client ID for MCP server authentication',
        type: 'string',
    })
        .option('oauth-client-secret', {
        describe: 'OAuth client secret for MCP server authentication',
        type: 'string',
    })
        .option('oauth-redirect-uri', {
        describe: 'OAuth redirect URI (e.g., https://your-server.com/oauth/callback). Defaults to localhost for local setups.',
        type: 'string',
    })
        .option('oauth-authorization-url', {
        describe: 'OAuth authorization URL',
        type: 'string',
    })
        .option('oauth-token-url', {
        describe: 'OAuth token URL',
        type: 'string',
    })
        .option('oauth-scopes', {
        describe: 'OAuth scopes (comma-separated)',
        type: 'array',
        string: true,
    })
        .middleware((argv) => {
        // Handle -- separator args as server args if present
        if (argv['--']) {
            const existingArgs = argv['args'] || [];
            argv['args'] = [...existingArgs, ...argv['--']];
        }
        // Auto-detect transport from URL if not explicitly specified
        if (!argv['transport']) {
            const commandOrUrl = argv['commandOrUrl'];
            if (commandOrUrl &&
                (commandOrUrl.startsWith('http://') ||
                    commandOrUrl.startsWith('https://'))) {
                argv['transport'] = 'http';
            }
            else {
                argv['transport'] = 'stdio';
            }
        }
    }),
    handler: async (argv) => {
        await addMcpServer(argv['name'], argv['commandOrUrl'], argv['args'], {
            scope: argv['scope'],
            transport: argv['transport'],
            env: argv['env'],
            header: argv['header'],
            timeout: argv['timeout'],
            trust: argv['trust'],
            description: argv['description'],
            includeTools: argv['includeTools'],
            excludeTools: argv['excludeTools'],
            oauthClientId: argv['oauthClientId'],
            oauthClientSecret: argv['oauthClientSecret'],
            oauthRedirectUri: argv['oauthRedirectUri'],
            oauthAuthorizationUrl: argv['oauthAuthorizationUrl'],
            oauthTokenUrl: argv['oauthTokenUrl'],
            oauthScopes: argv['oauthScopes'],
        });
    },
};
//# sourceMappingURL=add.js.map