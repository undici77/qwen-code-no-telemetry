/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { CommandKind } from './types.js';
import { t } from '../../i18n/index.js';
export const rewindCommand = {
    name: 'rewind',
    altNames: ['rollback'],
    get description() {
        return t('Rewind conversation to a previous turn');
    },
    kind: CommandKind.BUILT_IN,
    supportedModes: ['interactive'],
    action: async () => ({
        type: 'dialog',
        dialog: 'rewind',
    }),
};
//# sourceMappingURL=rewindCommand.js.map