/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { ExtensionManager, isExtensionCommittedWithWarningsError, parseInstallSource, } from '@qwen-code/qwen-code-core';
import { getErrorMessage } from '../../utils/errors.js';
import { writeStdoutLine, writeStderrLine } from '../../utils/stdioHelpers.js';
import { isWorkspaceTrusted } from '../../config/trustedFolders.js';
import { loadSettings } from '../../config/settings.js';
import { requestConsentOrFail, requestConsentNonInteractive, requestChoicePluginNonInteractive, } from './consent.js';
import { t, getCurrentLanguage } from '../../i18n/index.js';
// "workspace" is accepted as an alias of "project" to match enable/disable.
function normalizeScope(scope) {
    return scope === 'project' || scope === 'workspace' ? 'project' : 'user';
}
export async function handleInstall(args) {
    const scope = normalizeScope(args.scope);
    let extensionManager;
    try {
        const installMetadata = await parseInstallSource(args.source);
        if (installMetadata.type !== 'git' &&
            installMetadata.type !== 'github-release' &&
            installMetadata.type !== 'npm' &&
            installMetadata.type !== 'archive-url') {
            if (args.ref || args.autoUpdate) {
                throw new Error(t('--ref and --auto-update are not applicable for marketplace extensions.'));
            }
        }
        if ((installMetadata.type === 'npm' ||
            installMetadata.type === 'archive-url') &&
            args.ref) {
            throw new Error(t(installMetadata.type === 'npm'
                ? '--ref is not applicable for npm extensions. Use @version suffix instead (e.g. @scope/package@1.2.0).'
                : '--ref is not applicable for archive URL extensions.'));
        }
        if (installMetadata.type !== 'npm' && args.registry) {
            throw new Error(t('--registry is only applicable for npm extensions.'));
        }
        if (installMetadata.type === 'npm' && args.registry) {
            installMetadata.registryUrl = args.registry;
        }
        const requestConsent = args.consent
            ? () => Promise.resolve()
            : requestConsentOrFail.bind(null, requestConsentNonInteractive);
        const workspaceDir = process.cwd();
        extensionManager = new ExtensionManager({
            workspaceDir,
            locale: getCurrentLanguage(),
            isWorkspaceTrusted: isWorkspaceTrusted(loadSettings(workspaceDir).merged).isTrusted ?? true,
            requestConsent,
            requestChoicePlugin: requestChoicePluginNonInteractive,
        });
        await extensionManager.refreshCache();
        const extension = await extensionManager.installExtension({
            ...installMetadata,
            ref: args.ref,
            autoUpdate: args.autoUpdate,
            allowPreRelease: args.allowPreRelease,
        }, requestConsent, undefined, workspaceDir, undefined, scope === 'project'
            ? { scope: 'workspace', workspacePath: workspaceDir }
            : { scope: 'user' });
        if (args.scope) {
            try {
                extensionManager.setExtensionScope(extension.name, scope);
            }
            catch (scopeError) {
                writeStderrLine(`Warning: Extension installed, but failed to save scope preference: ${getErrorMessage(scopeError)}`);
            }
        }
        writeStdoutLine(scope === 'project'
            ? t('Extension "{{name}}" installed successfully and enabled for the current workspace.', { name: extension.name })
            : t('Extension "{{name}}" installed successfully and enabled.', {
                name: extension.name,
            }));
    }
    catch (error) {
        if (isExtensionCommittedWithWarningsError(error)) {
            if (args.scope && extensionManager) {
                try {
                    extensionManager.setExtensionScope(error.identity.name, scope);
                }
                catch (scopeError) {
                    writeStderrLine(`Warning: Extension installed, but failed to save scope preference: ${getErrorMessage(scopeError)}`);
                }
            }
            writeStderrLine(`Warning: ${getErrorMessage(error)}`);
            return;
        }
        writeStderrLine(getErrorMessage(error));
        process.exit(1);
    }
}
export const installCommand = {
    command: 'install <source>',
    describe: t('Installs an extension from a git repository URL, local path or archive, archive URL, scoped npm package (@scope/name), or claude marketplace (marketplace-url:plugin-name).'),
    builder: (yargs) => yargs
        .positional('source', {
        describe: t('The github URL, local path or archive, archive URL, or marketplace source (marketplace-url:plugin-name) of the extension to install.'),
        type: 'string',
        demandOption: true,
    })
        .option('ref', {
        describe: t('The git ref to install from.'),
        type: 'string',
    })
        .option('auto-update', {
        describe: t('Enable auto-update for this extension.'),
        type: 'boolean',
    })
        .option('pre-release', {
        describe: t('Enable pre-release versions for this extension.'),
        type: 'boolean',
    })
        .option('registry', {
        describe: t('Custom npm registry URL (only for npm extensions).'),
        type: 'string',
    })
        .option('consent', {
        describe: t('Acknowledge the security risks of installing an extension and skip the confirmation prompt.'),
        type: 'boolean',
        default: false,
    })
        .option('scope', {
        describe: t('The scope to install the extension in: "user" (global, default) or "project" (current workspace only).'),
        type: 'string',
        choices: ['user', 'project', 'workspace'],
    })
        .check((argv) => {
        if (!argv.source) {
            throw new Error(t('The source argument must be provided.'));
        }
        return true;
    }),
    handler: async (argv) => {
        await handleInstall({
            source: argv['source'],
            ref: argv['ref'],
            autoUpdate: argv['auto-update'],
            allowPreRelease: argv['pre-release'],
            consent: argv['consent'],
            registry: argv['registry'],
            scope: argv['scope'],
        });
    },
};
//# sourceMappingURL=install.js.map