/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { CommandKind } from './types.js';
import { t } from '../../i18n/index.js';
export const themeCommand = {
    name: 'theme',
    get description() {
        return t('change the theme');
    },
    kind: CommandKind.BUILT_IN,
    supportedModes: ['interactive'],
    action: (_context, _args) => ({
        type: 'dialog',
        dialog: 'theme',
    }),
};
//# sourceMappingURL=themeCommand.js.map