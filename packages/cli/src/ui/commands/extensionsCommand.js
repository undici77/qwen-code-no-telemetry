/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { getErrorMessage } from '../../utils/errors.js';
import { MessageType } from '../types.js';
import { CommandKind, } from './types.js';
import { t, getCurrentLanguage } from '../../i18n/index.js';
import { ExtensionManager, openBrowserSecurely, parseInstallSource, createDebugLogger, redactUrlCredentials, getExtensionDisplayName, getExtensionDescription, isExtensionCommittedWithWarningsError, } from '@qwen-code/qwen-code-core';
const debugLogger = createDebugLogger('EXTENSIONS_COMMAND');
const EXTENSION_EXPLORE_URL = {
    Gemini: 'https://geminicli.com/extensions/',
    ClaudeCode: 'https://claudemarketplaces.com/',
};
async function exploreAction(context, args) {
    const mode = context.executionMode ?? 'interactive';
    if (mode !== 'interactive') {
        return {
            type: 'message',
            messageType: 'error',
            content: t('/extensions explore is only available in interactive mode.'),
        };
    }
    const source = args.trim();
    const extensionsUrl = source
        ? EXTENSION_EXPLORE_URL[source]
        : '';
    if (!extensionsUrl) {
        context.ui.addItem({
            type: MessageType.ERROR,
            text: t('Unknown extensions source: {{source}}.', { source }),
        }, Date.now());
        return;
    }
    // Only check for NODE_ENV for explicit test mode, not for unit test framework
    if (process.env['NODE_ENV'] === 'test') {
        context.ui.addItem({
            type: MessageType.INFO,
            text: t('Would open extensions page in your browser: {{url}} (skipped in test environment)', { url: extensionsUrl }),
        }, Date.now());
    }
    else if (process.env['SANDBOX'] &&
        process.env['SANDBOX'] !== 'sandbox-exec') {
        context.ui.addItem({
            type: MessageType.INFO,
            text: t('View available extensions at {{url}}', { url: extensionsUrl }),
        }, Date.now());
    }
    else {
        context.ui.addItem({
            type: MessageType.INFO,
            text: t('Opening extensions page in your browser: {{url}}', {
                url: extensionsUrl,
            }),
        }, Date.now());
        try {
            await openBrowserSecurely(extensionsUrl);
        }
        catch (_error) {
            context.ui.addItem({
                type: MessageType.ERROR,
                text: t('Failed to open browser. Check out the extensions gallery at {{url}}', { url: extensionsUrl }),
            }, Date.now());
        }
    }
    return undefined;
}
async function listAction(context, args) {
    const mode = context.executionMode ?? 'interactive';
    if (mode !== 'interactive') {
        return listTextAction(context, args);
    }
    return {
        type: 'dialog',
        dialog: 'extensions_manage',
    };
}
async function listTextAction(context, _args) {
    const config = context.services.config;
    if (!config) {
        return {
            type: 'message',
            messageType: 'error',
            content: t('Config not loaded.'),
        };
    }
    let extensions;
    try {
        extensions = config.getExtensions();
    }
    catch (error) {
        return {
            type: 'message',
            messageType: 'error',
            content: t('Failed to read extensions: {{error}}', {
                error: error instanceof Error ? error.message : String(error),
            }),
        };
    }
    if (extensions.length === 0) {
        return {
            type: 'message',
            messageType: 'info',
            content: t('No extensions installed.'),
        };
    }
    const active = extensions.filter((e) => e.isActive);
    let output = t('**Installed Extensions ({{total}} total, {{active}} active)**', {
        total: String(extensions.length),
        active: String(active.length),
    }) + '\n\n';
    const locale = getCurrentLanguage();
    for (const ext of extensions) {
        const status = ext.isActive ? '✓' : '✗';
        const displayLabel = getExtensionDisplayName(ext, locale);
        const description = getExtensionDescription(ext, locale);
        const caps = [];
        const mcpCount = ext.mcpServers ? Object.keys(ext.mcpServers).length : 0;
        if (mcpCount > 0) {
            caps.push(t('{{count}} MCP servers', { count: String(mcpCount) }));
        }
        if (ext.skills && ext.skills.length > 0) {
            caps.push(t('{{count}} skills', { count: String(ext.skills.length) }));
        }
        if (ext.commands && ext.commands.length > 0) {
            caps.push(t('{{count}} commands', { count: String(ext.commands.length) }));
        }
        const capsStr = caps.length > 0 ? ` [${caps.join(', ')}]` : '';
        output += `- [${status}] **${displayLabel}**${capsStr}\n`;
        if (description) {
            const maxLen = 80;
            const truncated = description.length > maxLen
                ? description.slice(0, maxLen - 1) + '…'
                : description;
            output += `  ${truncated}\n`;
        }
    }
    return {
        type: 'message',
        messageType: 'info',
        content: output,
    };
}
async function installAction(context, args) {
    const mode = context.executionMode ?? 'interactive';
    if (mode !== 'interactive') {
        return {
            type: 'message',
            messageType: 'error',
            content: t('/extensions install is only available in interactive mode.'),
        };
    }
    const extensionManager = context.services.config?.getExtensionManager();
    if (!(extensionManager instanceof ExtensionManager)) {
        debugLogger.error(`Cannot ${context.invocation?.name} extensions in this environment`);
        return;
    }
    const source = args.trim();
    if (!source) {
        context.ui.addItem({
            type: MessageType.ERROR,
            text: t('Usage: /extensions install <source>'),
        }, Date.now());
        return;
    }
    try {
        const installMetadata = await parseInstallSource(source);
        const redactedSource = redactUrlCredentials(source);
        context.ui.addItem({
            type: MessageType.INFO,
            text: t('Installing extension from "{{source}}"...', {
                source: redactedSource,
            }),
        }, Date.now());
        const extension = await extensionManager.installExtension(installMetadata);
        context.ui.addItem({
            type: MessageType.INFO,
            text: t('Extension "{{name}}" installed successfully.', {
                name: extension.name,
            }),
        }, Date.now());
        // FIXME: refresh command controlled by ui for now, cannot be auto refreshed by extensionManager
        context.ui.reloadCommands();
    }
    catch (error) {
        if (isExtensionCommittedWithWarningsError(error)) {
            context.ui.addItem({
                type: MessageType.WARNING,
                text: t('Extension was installed but could not be reloaded: {{error}}', { error: redactUrlCredentials(getErrorMessage(error)) }),
            }, Date.now());
            context.ui.reloadCommands();
            return;
        }
        context.ui.addItem({
            type: MessageType.ERROR,
            text: t('Failed to install extension from "{{source}}": {{error}}', {
                source: redactUrlCredentials(source),
                error: redactUrlCredentials(getErrorMessage(error)),
            }),
        }, Date.now());
        return;
    }
    return undefined;
}
export async function completeExtensions(context, partialArg) {
    let extensions = context.services.config?.getExtensions() ?? [];
    if (context.invocation?.name === 'enable') {
        extensions = extensions.filter((ext) => !ext.isActive);
    }
    if (context.invocation?.name === 'disable' ||
        context.invocation?.name === 'restart') {
        extensions = extensions.filter((ext) => ext.isActive);
    }
    const extensionNames = extensions.map((ext) => ext.name);
    const suggestions = extensionNames.filter((name) => name.startsWith(partialArg));
    if (context.invocation?.name !== 'uninstall' &&
        context.invocation?.name !== 'detail') {
        if ('--all'.startsWith(partialArg) || 'all'.startsWith(partialArg)) {
            suggestions.unshift('--all');
        }
    }
    return suggestions;
}
export async function completeExtensionsAndScopes(context, partialArg) {
    const completions = await completeExtensions(context, partialArg);
    return completions.flatMap((s) => [
        `${s} --scope user`,
        `${s} --scope workspace`,
    ]);
}
export async function completeExtensionsExplore(context, partialArg) {
    const suggestions = Object.keys(EXTENSION_EXPLORE_URL).filter((name) => name.startsWith(partialArg));
    return suggestions;
}
const exploreExtensionsCommand = {
    name: 'explore',
    get description() {
        return t('Open extensions page in your browser');
    },
    kind: CommandKind.BUILT_IN,
    supportedModes: ['interactive'],
    action: exploreAction,
    completion: completeExtensionsExplore,
};
const manageExtensionsCommand = {
    name: 'manage',
    get description() {
        return t('Manage installed extensions');
    },
    kind: CommandKind.BUILT_IN,
    supportedModes: ['interactive'],
    action: listAction,
};
const listExtensionsCommand = {
    name: 'list',
    get description() {
        return t('List installed extensions');
    },
    kind: CommandKind.BUILT_IN,
    supportedModes: ['interactive', 'non_interactive', 'acp'],
    action: listTextAction,
};
const installCommand = {
    name: 'install',
    get description() {
        return t('Install an extension from a git repo or local path');
    },
    kind: CommandKind.BUILT_IN,
    supportedModes: ['interactive'],
    action: installAction,
};
export const extensionsCommand = {
    name: 'extensions',
    get description() {
        return t('Manage extensions');
    },
    kind: CommandKind.BUILT_IN,
    supportedModes: ['interactive', 'non_interactive', 'acp'],
    subCommands: [
        listExtensionsCommand,
        manageExtensionsCommand,
        installCommand,
        exploreExtensionsCommand,
    ],
    action: async (context, args) => {
        const executionMode = context.executionMode ?? 'interactive';
        if (executionMode === 'interactive') {
            return manageExtensionsCommand.action(context, args);
        }
        return listTextAction(context, args);
    },
};
//# sourceMappingURL=extensionsCommand.js.map