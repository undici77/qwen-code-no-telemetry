/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { CommandKind, } from './types.js';
import { t } from '../../i18n/index.js';
import { ApprovalMode } from '@qwen-code/qwen-code-core';
export const planCommand = {
    name: 'plan',
    get description() {
        return t('Switch to plan mode or exit plan mode');
    },
    kind: CommandKind.BUILT_IN,
    supportedModes: ['interactive'],
    action: async (context, args) => {
        const { config } = context.services;
        if (!config) {
            return {
                type: 'message',
                messageType: 'error',
                content: t('Configuration is not available.'),
            };
        }
        const trimmedArgs = args.trim();
        const currentMode = config.getApprovalMode();
        if (trimmedArgs === 'exit') {
            if (currentMode !== ApprovalMode.PLAN) {
                return {
                    type: 'message',
                    messageType: 'error',
                    content: t('Not in plan mode. Use "/plan" to enter plan mode first.'),
                };
            }
            try {
                config.setApprovalMode(config.getPrePlanMode());
            }
            catch (e) {
                return {
                    type: 'message',
                    messageType: 'error',
                    content: e.message,
                };
            }
            return {
                type: 'message',
                messageType: 'info',
                content: t('Exited plan mode. Previous approval mode restored.'),
            };
        }
        if (currentMode !== ApprovalMode.PLAN) {
            try {
                config.setApprovalMode(ApprovalMode.PLAN);
            }
            catch (e) {
                return {
                    type: 'message',
                    messageType: 'error',
                    content: e.message,
                };
            }
            if (trimmedArgs) {
                return {
                    type: 'submit_prompt',
                    content: [{ text: trimmedArgs }],
                };
            }
            return {
                type: 'message',
                messageType: 'info',
                content: t('Enabled plan mode. The agent will analyze and plan without executing tools.'),
            };
        }
        // Already in plan mode
        if (trimmedArgs) {
            return {
                type: 'submit_prompt',
                content: [{ text: trimmedArgs }],
            };
        }
        return {
            type: 'message',
            messageType: 'info',
            content: t('Already in plan mode. Use "/plan exit" to exit plan mode.'),
        };
    },
};
//# sourceMappingURL=planCommand.js.map