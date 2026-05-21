/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import {} from 'yargs';
import { FatalConfigError, getErrorMessage } from '@qwen-code/qwen-code-core';
import { SettingScope } from '../../config/settings.js';
import { writeStdoutLine } from '../../utils/stdioHelpers.js';
import { getExtensionManager } from './utils.js';
import { t } from '../../i18n/index.js';
export async function handleEnable(args) {
    const extensionManager = await getExtensionManager();
    try {
        if (args.scope?.toLowerCase() === 'workspace') {
            extensionManager.enableExtension(args.name, SettingScope.Workspace);
        }
        else {
            extensionManager.enableExtension(args.name, SettingScope.User);
        }
        if (args.scope) {
            writeStdoutLine(t('Extension "{{name}}" successfully enabled for scope "{{scope}}".', {
                name: args.name,
                scope: args.scope,
            }));
        }
        else {
            writeStdoutLine(t('Extension "{{name}}" successfully enabled in all scopes.', {
                name: args.name,
            }));
        }
    }
    catch (error) {
        throw new FatalConfigError(getErrorMessage(error));
    }
}
export const enableCommand = {
    command: 'enable [--scope] <name>',
    describe: t('Enables an extension.'),
    builder: (yargs) => yargs
        .positional('name', {
        describe: t('The name of the extension to enable.'),
        type: 'string',
    })
        .option('scope', {
        describe: t('The scope to enable the extenison in. If not set, will be enabled in all scopes.'),
        type: 'string',
    })
        .check((argv) => {
        if (argv.scope &&
            !Object.values(SettingScope)
                .map((s) => s.toLowerCase())
                .includes(argv.scope.toLowerCase())) {
            throw new Error(t('Invalid scope: {{scope}}. Please use one of {{scopes}}.', {
                scope: argv.scope,
                scopes: Object.values(SettingScope)
                    .map((s) => s.toLowerCase())
                    .join(', '),
            }));
        }
        return true;
    }),
    handler: async (argv) => {
        await handleEnable({
            name: argv['name'],
            scope: argv['scope'],
        });
    },
};
//# sourceMappingURL=enable.js.map