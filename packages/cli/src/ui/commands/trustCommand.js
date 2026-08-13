/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { CommandKind } from './types.js';
import { t } from '../../i18n/index.js';
export const trustCommand = {
    name: 'trust',
    get description() {
        return t('Manage folder trust settings');
    },
    kind: CommandKind.BUILT_IN,
    supportedModes: ['interactive'],
    action: () => ({
        type: 'dialog',
        dialog: 'trust',
    }),
};
//# sourceMappingURL=trustCommand.js.map