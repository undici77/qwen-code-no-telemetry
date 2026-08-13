/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { CommandKind } from './types.js';
import { t } from '../../i18n/index.js';
export const settingsCommand = {
    name: 'settings',
    get description() {
        return t('View and edit Qwen Code settings');
    },
    kind: CommandKind.BUILT_IN,
    supportedModes: ['interactive'],
    canRunDuringStreaming: true,
    action: (_context, _args) => ({
        type: 'dialog',
        dialog: 'settings',
    }),
};
//# sourceMappingURL=settingsCommand.js.map