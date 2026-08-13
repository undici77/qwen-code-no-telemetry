/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { CommandKind, } from './types.js';
import { MessageType } from '../types.js';
import { t } from '../../i18n/index.js';
export const toolsCommand = {
    name: 'tools',
    get description() {
        return t('List available Qwen Code tools. Usage: /tools [desc]');
    },
    kind: CommandKind.BUILT_IN,
    action: async (context, args) => {
        const subCommand = args?.trim();
        // Default to NOT showing descriptions. The user must opt in with an argument.
        let useShowDescriptions = false;
        if (subCommand === 'desc' || subCommand === 'descriptions') {
            useShowDescriptions = true;
        }
        const toolRegistry = context.services.config?.getToolRegistry();
        if (!toolRegistry) {
            context.ui.addItem({
                type: MessageType.ERROR,
                text: t('Could not retrieve tool registry.'),
            }, Date.now());
            return;
        }
        const tools = toolRegistry.getAllTools();
        // Filter out MCP tools by checking for the absence of a serverName property
        const geminiTools = tools.filter((tool) => !('serverName' in tool));
        const toolsListItem = {
            type: MessageType.TOOLS_LIST,
            tools: geminiTools.map((tool) => ({
                name: tool.name,
                displayName: tool.displayName,
                description: tool.description,
            })),
            showDescriptions: useShowDescriptions,
        };
        context.ui.addItem(toolsListItem, Date.now());
    },
};
//# sourceMappingURL=toolsCommand.js.map