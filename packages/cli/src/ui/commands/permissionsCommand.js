/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { CommandKind } from './types.js';
import { t } from '../../i18n/index.js';
export const permissionsCommand = {
    name: 'permissions',
    get description() {
        return t('Manage permission rules');
    },
    kind: CommandKind.BUILT_IN,
    supportedModes: ['interactive'],
    action: () => ({
        type: 'dialog',
        dialog: 'permissions',
    }),
};
//# sourceMappingURL=permissionsCommand.js.map