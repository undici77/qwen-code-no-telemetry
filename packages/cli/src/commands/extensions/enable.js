/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import {} from 'yargs';
import { FatalConfigError, getErrorMessage } from '@qwen-code/qwen-code-core';
import { writeStderrLine, writeStdoutLine } from '../../utils/stdioHelpers.js';
import { getExtensionManager, resolveExtensionCommandScope } from './utils.js';
import { t } from '../../i18n/index.js';
export async function handleEnable(args) {
    const extensionManager = await getExtensionManager();
    try {
        const scope = resolveExtensionCommandScope(args.scope);
        const result = await extensionManager.enableExtension(args.name, scope);
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
        for (const warning of result.warnings ?? []) {
            writeStderrLine(`${warning.code}: ${warning.error}`);
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
        describe: t('The scope to enable the extension in. If not set, will be enabled in all scopes.'),
        type: 'string',
    })
        .check((argv) => {
        resolveExtensionCommandScope(argv.scope);
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