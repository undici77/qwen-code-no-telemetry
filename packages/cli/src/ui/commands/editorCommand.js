/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { CommandKind, } from './types.js';
import { t } from '../../i18n/index.js';
export const editorCommand = {
    name: 'editor',
    get description() {
        return t('set external editor preference');
    },
    kind: CommandKind.BUILT_IN,
    supportedModes: ['interactive'],
    action: () => ({
        type: 'dialog',
        dialog: 'editor',
    }),
};
//# sourceMappingURL=editorCommand.js.map