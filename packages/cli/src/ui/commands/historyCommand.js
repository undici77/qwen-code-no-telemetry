/**
 * @license
 * Copyright 2025 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */
import { CommandKind } from './types.js';
import { t } from '../../i18n/index.js';
import { SettingScope } from '../../config/settings.js';
const collapseOnResumeCommand = {
    name: 'collapse-on-resume',
    get description() {
        return t('Set history to collapse by default when resuming a session');
    },
    kind: CommandKind.BUILT_IN,
    supportedModes: ['interactive'],
    action: (context) => {
        const { settings } = context.services;
        settings.setValue(SettingScope.User, 'ui.history.collapseOnResume', true);
        return {
            type: 'message',
            messageType: 'info',
            content: t('History will be collapsed by default for future resumed sessions.'),
        };
    },
};
const expandOnResumeCommand = {
    name: 'expand-on-resume',
    get description() {
        return t('Set history to expand by default when resuming a session');
    },
    kind: CommandKind.BUILT_IN,
    supportedModes: ['interactive'],
    action: (context) => {
        const { settings } = context.services;
        settings.setValue(SettingScope.User, 'ui.history.collapseOnResume', false);
        return {
            type: 'message',
            messageType: 'info',
            content: t('History will be expanded by default for future resumed sessions.'),
        };
    },
};
const expandNowCommand = {
    name: 'expand-now',
    get description() {
        return t('Expand the currently collapsed history transcript');
    },
    kind: CommandKind.BUILT_IN,
    supportedModes: ['interactive'],
    action: async (context) => {
        const { history, loadHistory, refreshStatic } = context.ui;
        const hasSuppressed = history.some((item) => item.display?.suppressOnRestore);
        if (!hasSuppressed) {
            return {
                type: 'message',
                messageType: 'info',
                content: t('History is already expanded in this session.'),
            };
        }
        // Remove suppressOnRestore from all items and drop collapse summary items.
        const { expandCollapsedHistory } = await import('../utils/resumeHistoryUtils.js');
        const updated = expandCollapsedHistory(history);
        loadHistory(updated);
        refreshStatic();
        // No return — the loadHistory/refreshStatic calls handle the UI update
    },
};
export const historyCommand = {
    name: 'history',
    get description() {
        return t('Control history display preferences and visibility');
    },
    argumentHint: 'collapse-on-resume|expand-on-resume|expand-now',
    kind: CommandKind.BUILT_IN,
    supportedModes: ['interactive'],
    subCommands: [
        collapseOnResumeCommand,
        expandOnResumeCommand,
        expandNowCommand,
    ],
    action: async () => ({
        type: 'message',
        messageType: 'error',
        content: t('Usage: /history collapse-on-resume|expand-on-resume|expand-now'),
    }),
};
//# sourceMappingURL=historyCommand.js.map