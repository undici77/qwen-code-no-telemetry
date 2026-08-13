/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import {} from 'yargs';
import { SettingScope } from '../../config/settings.js';
import { getErrorMessage } from '../../utils/errors.js';
import { writeStdoutLine, writeStderrLine } from '../../utils/stdioHelpers.js';
import { getExtensionManager, resolveExtensionCommandScope } from './utils.js';
import { t } from '../../i18n/index.js';
export async function handleDisable(args) {
    const extensionManager = await getExtensionManager();
    try {
        const scope = resolveExtensionCommandScope(args.scope);
        const result = await extensionManager.disableExtension(args.name, scope);
        writeStdoutLine(t('Extension "{{name}}" successfully disabled for scope "{{scope}}".', {
            name: args.name,
            scope: args.scope || SettingScope.User,
        }));
        for (const warning of result.warnings ?? []) {
            writeStderrLine(`${warning.code}: ${warning.error}`);
        }
    }
    catch (error) {
        writeStderrLine(getErrorMessage(error));
        process.exit(1);
    }
}
export const disableCommand = {
    command: 'disable [--scope] <name>',
    describe: t('Disables an extension.'),
    builder: (yargs) => yargs
        .positional('name', {
        describe: t('The name of the extension to disable.'),
        type: 'string',
    })
        .option('scope', {
        describe: t('The scope to disable the extension in.'),
        type: 'string',
        default: SettingScope.User,
    })
        .check((argv) => {
        resolveExtensionCommandScope(argv.scope);
        return true;
    }),
    handler: async (argv) => {
        await handleDisable({
            name: argv['name'],
            scope: argv['scope'],
        });
    },
};
//# sourceMappingURL=disable.js.map