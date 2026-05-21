/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { CommandKind } from './types.js';
import { t } from '../../i18n/index.js';
export const mcpCommand = {
    name: 'mcp',
    get description() {
        return t('Open MCP management dialog');
    },
    argumentHint: 'desc|nodesc|schema|auth|noauth',
    kind: CommandKind.BUILT_IN,
    supportedModes: ['interactive'],
    action: async () => ({
        type: 'dialog',
        dialog: 'mcp',
    }),
};
//# sourceMappingURL=mcpCommand.js.map