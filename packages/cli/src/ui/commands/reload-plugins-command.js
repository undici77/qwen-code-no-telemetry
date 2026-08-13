/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { reloadPluginsRuntime, } from '../../config/extension-runtime-reload.js';
import { ExtensionRefreshState } from '../../config/extension-refresh-state.js';
import { t } from '../../i18n/index.js';
import { CommandKind, } from './types.js';
function summaryCountTerm(count, singularKey, pluralKey) {
    return t(count === 1 ? singularKey : pluralKey, {
        count: String(count),
    });
}
export function formatReloadPluginsSummary(summary) {
    return [
        summaryCountTerm(summary.extensionCount, '{{count}} extension', '{{count}} extensions'),
        summaryCountTerm(summary.commandCount, '{{count}} command', '{{count}} commands'),
        summaryCountTerm(summary.skillCount, '{{count}} skill', '{{count}} skills'),
        summaryCountTerm(summary.agentCount, '{{count}} agent', '{{count}} agents'),
        summaryCountTerm(summary.hookCount, '{{count}} hook', '{{count}} hooks'),
        summaryCountTerm(summary.mcpServerCount, '{{count}} extension MCP server', '{{count}} extension MCP servers'),
        summaryCountTerm(summary.lspServerCount, '{{count}} extension LSP server', '{{count}} extension LSP servers'),
    ].join(' · ');
}
export const reloadPluginsCommand = {
    name: 'reload-plugins',
    get description() {
        return t('Reload extension changes from disk');
    },
    kind: CommandKind.BUILT_IN,
    supportedModes: ['interactive'],
    action: async (context) => {
        const config = context.services.config;
        if (!config) {
            return {
                type: 'message',
                messageType: 'error',
                content: t('Config not loaded.'),
            };
        }
        const extensionRefreshState = context.services.extensionRefreshState ?? new ExtensionRefreshState();
        try {
            extensionRefreshState.notifyExtensionsReloadStarted();
            const summary = await reloadPluginsRuntime({
                config,
                reloadCommands: context.ui.reloadCommands,
            });
            extensionRefreshState.clearExtensionsChanged();
            return {
                type: 'message',
                messageType: 'info',
                content: t('Reloaded extensions: {{summary}}', {
                    summary: formatReloadPluginsSummary(summary),
                }),
            };
        }
        catch (error) {
            extensionRefreshState.markExtensionsReloadFailed();
            return {
                type: 'message',
                messageType: 'error',
                content: error instanceof Error
                    ? t('Reload failed: {{message}}', { message: error.message })
                    : t('Reload failed.'),
            };
        }
    },
};
//# sourceMappingURL=reload-plugins-command.js.map