/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { getErrorMessage } from '../../utils/errors.js';
import { MessageType } from '../types.js';
import { CommandKind, } from './types.js';
import { t } from '../../i18n/index.js';
import { ExtensionManager, parseInstallSource, createDebugLogger, } from '@qwen-code/qwen-code-core';
import open from 'open';
const debugLogger = createDebugLogger('EXTENSIONS_COMMAND');
const EXTENSION_EXPLORE_URL = {
    Gemini: 'https://geminicli.com/extensions/',
    ClaudeCode: 'https://claudemarketplaces.com/',
};
async function exploreAction(context, args) {
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
            await open(extensionsUrl);
        }
        catch (_error) {
            context.ui.addItem({
                type: MessageType.ERROR,
                text: t('Failed to open browser. Check out the extensions gallery at {{url}}', { url: extensionsUrl }),
            }, Date.now());
        }
    }
}
async function listAction(_context, _args) {
    return {
        type: 'dialog',
        dialog: 'extensions_manage',
    };
}
async function installAction(context, args) {
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
        context.ui.addItem({
            type: MessageType.INFO,
            text: t('Installing extension from "{{source}}"...', { source }),
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
        context.ui.addItem({
            type: MessageType.ERROR,
            text: t('Failed to install extension from "{{source}}": {{error}}', {
                source,
                error: getErrorMessage(error),
            }),
        }, Date.now());
        return;
    }
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
    supportedModes: ['interactive'],
    subCommands: [
        manageExtensionsCommand,
        installCommand,
        exploreExtensionsCommand,
    ],
    action: async (context, args) => 
    // Default to list if no subcommand is provided
    manageExtensionsCommand.action(context, args),
};
//# sourceMappingURL=extensionsCommand.js.map