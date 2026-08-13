/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { CommandKind } from './types.js';
import { t } from '../../i18n/index.js';
export const memoryCommand = {
    name: 'memory',
    get description() {
        return t('Open the memory manager.');
    },
    kind: CommandKind.BUILT_IN,
    supportedModes: ['interactive'],
    action: async () => ({
        type: 'dialog',
        dialog: 'memory',
    }),
};
//# sourceMappingURL=memoryCommand.js.map