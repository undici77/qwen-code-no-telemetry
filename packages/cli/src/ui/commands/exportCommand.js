/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import * as fs from 'node:fs/promises';
import path from 'node:path';
import { CommandKind, } from './types.js';
import { createDebugLogger, isSubpath, SessionService, } from '@qwen-code/qwen-code-core';
import { collectSessionData, normalizeSessionData, toMarkdown, toHtml, toJson, toJsonl, generateExportFilename, } from '../utils/export/index.js';
import { t } from '../../i18n/index.js';
const EXPORT_DIR_OUT_OF_CWD = 'Export directory must be within the project working directory.';
const debugLogger = createDebugLogger('EXPORT_COMMAND');
function formatExportTargetContext(target) {
    return `target: "${target.outputDir}", cwd: "${target.resolvedCwd}"`;
}
function formatMissingCwdError(resolvedCwd) {
    return (`Cannot resolve any existing ancestor within cwd: ${resolvedCwd}. ` +
        'This usually means the project working directory has been deleted ' +
        'or is on an unmounted filesystem.');
}
function resolveExportTarget(cwd, args, extension) {
    const filename = generateExportFilename(extension);
    const outputDirArg = args.trim();
    const resolvedCwd = path.resolve(cwd);
    const outputDir = outputDirArg
        ? path.resolve(resolvedCwd, outputDirArg)
        : resolvedCwd;
    const filepath = path.join(outputDir, filename);
    const isDefaultOutputDir = outputDir === resolvedCwd;
    const isInsideCwd = isSubpath(resolvedCwd, outputDir);
    const outputDirKind = outputDirArg && !isDefaultOutputDir ? 'custom' : 'default';
    return {
        filepath,
        outputDir,
        displayPath: isDefaultOutputDir
            ? filename
            : path.join(outputDirArg, filename),
        resolvedCwd,
        outputDirKind,
        isInsideCwd,
    };
}
async function validateExportTargetWithinCwd(target) {
    debugLogger.debug('Validating export target realpath:', formatExportTargetContext(target));
    let realCwd;
    let realOutputDir;
    try {
        [realCwd, realOutputDir] = await Promise.all([
            fs.realpath(target.resolvedCwd),
            fs.realpath(target.outputDir),
        ]);
    }
    catch (error) {
        if (error.code === 'ENOENT') {
            debugLogger.debug('Export target realpath validation failed: missing path', formatExportTargetContext(target));
            return {
                type: 'message',
                messageType: 'error',
                content: `Export target directory is not accessible (path does not exist; ${formatExportTargetContext(target)}).`,
            };
        }
        throw error;
    }
    if (!isSubpath(realCwd, realOutputDir)) {
        debugLogger.debug('Export target realpath escaped cwd:', {
            realCwd,
            realOutputDir,
            target,
        });
        return {
            type: 'message',
            messageType: 'error',
            content: `${EXPORT_DIR_OUT_OF_CWD} (target path resolves outside cwd via symlink; ${formatExportTargetContext(target)})`,
        };
    }
    return undefined;
}
async function realpathNearestExisting(outputDir, resolvedCwd) {
    let currentPath = outputDir;
    debugLogger.debug('Resolving nearest existing export parent:', {
        outputDir,
        resolvedCwd,
    });
    while (isSubpath(resolvedCwd, currentPath)) {
        try {
            const realCurrentPath = await fs.realpath(currentPath);
            debugLogger.debug('Resolved nearest existing export parent:', {
                currentPath,
                realCurrentPath,
            });
            return realCurrentPath;
        }
        catch (error) {
            if (error.code !== 'ENOENT') {
                debugLogger.debug('Failed to resolve existing export parent:', error);
                throw error;
            }
            const parentPath = path.dirname(currentPath);
            if (parentPath === currentPath) {
                break;
            }
            currentPath = parentPath;
        }
    }
    throw new Error(formatMissingCwdError(resolvedCwd));
}
async function validateExistingExportParentWithinCwd(target) {
    debugLogger.debug('Validating existing export parent realpath:', formatExportTargetContext(target));
    let realCwd;
    try {
        realCwd = await fs.realpath(target.resolvedCwd);
    }
    catch (error) {
        if (error.code === 'ENOENT') {
            throw new Error(formatMissingCwdError(target.resolvedCwd));
        }
        throw error;
    }
    const realExistingParent = await realpathNearestExisting(target.outputDir, target.resolvedCwd);
    if (!isSubpath(realCwd, realExistingParent)) {
        debugLogger.debug('Existing export parent escaped cwd:', {
            realCwd,
            realExistingParent,
            target,
        });
        return {
            type: 'message',
            messageType: 'error',
            content: `${EXPORT_DIR_OUT_OF_CWD} (parent path resolves outside cwd via symlink; ${formatExportTargetContext(target)})`,
        };
    }
    return undefined;
}
async function exportSessionAction(context, args, exportFormat) {
    const { services } = context;
    const { config } = services;
    if (!config) {
        return {
            type: 'message',
            messageType: 'error',
            content: 'Configuration not available.',
        };
    }
    const cwd = config.getWorkingDir() || config.getProjectRoot();
    if (!cwd) {
        return {
            type: 'message',
            messageType: 'error',
            content: 'Could not determine current working directory.',
        };
    }
    const target = resolveExportTarget(cwd, args, exportFormat.extension);
    const targetFilepath = target.filepath;
    debugLogger.debug('Resolved export target:', {
        format: exportFormat.displayName,
        cwd,
        outputDirArg: args.trim(),
        outputDir: target.outputDir,
        outputDirKind: target.outputDirKind,
        filepath: target.filepath,
    });
    if (!target.isInsideCwd) {
        debugLogger.debug('Export target rejected before realpath validation:', formatExportTargetContext(target));
        return {
            type: 'message',
            messageType: 'error',
            content: `${EXPORT_DIR_OUT_OF_CWD} (target path is outside cwd; ${formatExportTargetContext(target)})`,
        };
    }
    // Three-phase directory validation closes symlink-swap windows:
    // 1. Initial: validate the target or nearest existing parent before work.
    // 2. Post-mkdir: verify mkdir did not follow a symlink outside cwd.
    // 3. Pre-write: verify the target was not swapped before writeFile.
    try {
        const initialValidationError = target.outputDirKind === 'custom'
            ? await validateExistingExportParentWithinCwd(target)
            : await validateExportTargetWithinCwd(target);
        if (initialValidationError) {
            return initialValidationError;
        }
        debugLogger.debug('Export target validation passed:', {
            format: exportFormat.displayName,
            outputDir: target.outputDir,
            outputDirKind: target.outputDirKind,
        });
        // Load the current session using the current session ID
        const sessionService = new SessionService(cwd);
        const sessionId = config.getSessionId();
        debugLogger.debug('Loading session for export:', { sessionId, cwd });
        const sessionData = await sessionService.loadSession(sessionId);
        if (!sessionData) {
            debugLogger.debug('No active session found for export:', {
                sessionId,
                cwd,
            });
            return {
                type: 'message',
                messageType: 'error',
                content: 'No active session found to export.',
            };
        }
        const { conversation } = sessionData;
        // Collect and normalize export data (SSOT)
        const exportData = await collectSessionData(conversation, config);
        const normalizedData = normalizeSessionData(exportData, conversation.messages, config);
        const content = exportFormat.format(normalizedData);
        if (target.outputDirKind === 'custom') {
            try {
                debugLogger.debug('Creating export directory:', {
                    outputDir: target.outputDir,
                });
                await fs.mkdir(target.outputDir, { recursive: true, mode: 0o700 });
            }
            catch (error) {
                debugLogger.debug('Failed to create export directory:', error);
                return {
                    type: 'message',
                    messageType: 'error',
                    content: `Failed to create export directory "${target.outputDir}": ${error instanceof Error ? error.message : String(error)}`,
                };
            }
        }
        try {
            const writeValidationError = await validateExportTargetWithinCwd(target);
            if (writeValidationError) {
                return writeValidationError;
            }
        }
        catch (error) {
            debugLogger.debug('Export path validation failed before write:', error);
            return {
                type: 'message',
                messageType: 'error',
                content: `Export path validation failed: ${error instanceof Error ? error.message : String(error)} (${exportFormat.displayName} target: "${targetFilepath}")`,
            };
        }
        try {
            debugLogger.debug('Writing export file:', {
                format: exportFormat.displayName,
                filepath: target.filepath,
            });
            await fs.writeFile(target.filepath, content, {
                encoding: 'utf-8',
                mode: 0o600,
            });
            await fs.chmod(target.filepath, 0o600).catch((error) => {
                debugLogger.debug('Failed to tighten export file permissions:', error);
            });
        }
        catch (error) {
            debugLogger.debug('Failed to write export file:', error);
            return {
                type: 'message',
                messageType: 'error',
                content: `Failed to export session: ${error instanceof Error ? error.message : String(error)} (${exportFormat.displayName} target: "${targetFilepath}")`,
            };
        }
        debugLogger.debug('Session export completed:', {
            format: exportFormat.displayName,
            filepath: target.filepath,
        });
        return {
            type: 'message',
            messageType: 'info',
            content: `Session exported to ${exportFormat.displayName}: ${target.displayPath}`,
        };
    }
    catch (error) {
        debugLogger.debug('Session export failed:', {
            format: exportFormat.displayName,
            target,
            error,
        });
        return {
            type: 'message',
            messageType: 'error',
            content: `Failed to export session: ${error instanceof Error ? error.message : String(error)} (${exportFormat.displayName})`,
        };
    }
}
/**
 * Action for the 'md' subcommand - exports session to markdown.
 */
async function exportMarkdownAction(context, args) {
    return exportSessionAction(context, args, {
        extension: 'md',
        displayName: 'markdown',
        format: toMarkdown,
    });
}
/**
 * Action for the 'html' subcommand - exports session to HTML.
 */
async function exportHtmlAction(context, args) {
    return exportSessionAction(context, args, {
        extension: 'html',
        displayName: 'HTML',
        format: toHtml,
    });
}
/**
 * Action for the 'json' subcommand - exports session to JSON.
 */
async function exportJsonAction(context, args) {
    return exportSessionAction(context, args, {
        extension: 'json',
        displayName: 'JSON',
        format: toJson,
    });
}
/**
 * Action for the 'jsonl' subcommand - exports session to JSONL.
 */
async function exportJsonlAction(context, args) {
    return exportSessionAction(context, args, {
        extension: 'jsonl',
        displayName: 'JSONL',
        format: toJsonl,
    });
}
/**
 * Main export command with subcommands.
 */
export const exportCommand = {
    name: 'export',
    get description() {
        return t('Export current session message history to a file');
    },
    argumentHint: '[md|html|json|jsonl] [path]',
    kind: CommandKind.BUILT_IN,
    supportedModes: ['interactive', 'non_interactive', 'acp'],
    action: exportHtmlAction,
    subCommands: [
        {
            name: 'html',
            get description() {
                return t('Export session to HTML format');
            },
            kind: CommandKind.BUILT_IN,
            supportedModes: ['interactive', 'non_interactive', 'acp'],
            action: exportHtmlAction,
        },
        {
            name: 'md',
            get description() {
                return t('Export session to markdown format');
            },
            kind: CommandKind.BUILT_IN,
            supportedModes: ['interactive', 'non_interactive', 'acp'],
            action: exportMarkdownAction,
        },
        {
            name: 'json',
            get description() {
                return t('Export session to JSON format');
            },
            kind: CommandKind.BUILT_IN,
            supportedModes: ['interactive', 'non_interactive', 'acp'],
            action: exportJsonAction,
        },
        {
            name: 'jsonl',
            get description() {
                return t('Export session to JSONL format (one message per line)');
            },
            kind: CommandKind.BUILT_IN,
            supportedModes: ['interactive', 'non_interactive', 'acp'],
            action: exportJsonlAction,
        },
    ],
};
//# sourceMappingURL=exportCommand.js.map