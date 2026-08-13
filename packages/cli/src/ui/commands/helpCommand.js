/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { CommandKind } from './types.js';
import { t } from '../../i18n/index.js';
export const helpCommand = {
    name: 'help',
    altNames: ['?'],
    kind: CommandKind.BUILT_IN,
    supportedModes: ['interactive'],
    canRunDuringStreaming: true,
    get description() {
        return t('for help on Qwen Code');
    },
    action: async () => ({
        type: 'dialog',
        dialog: 'help',
    }),
};
//# sourceMappingURL=helpCommand.js.map