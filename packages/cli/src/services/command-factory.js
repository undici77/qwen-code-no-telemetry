/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * This file contains helper functions for FileCommandLoader to create SlashCommand
 * objects from parsed command definitions (TOML or Markdown).
 */
import path from 'node:path';
import { createDebugLogger } from '@qwen-code/qwen-code-core';
import { t } from '../i18n/index.js';
import { CommandKind } from '../ui/commands/types.js';
import { DefaultArgumentProcessor } from './prompt-processors/argumentProcessor.js';
import { SHORTHAND_ARGS_PLACEHOLDER, SHELL_INJECTION_TRIGGER, AT_FILE_INJECTION_TRIGGER, } from './prompt-processors/types.js';
import { ConfirmationRequiredError, ShellProcessor, } from './prompt-processors/shellProcessor.js';
import { AtFileProcessor } from './prompt-processors/atFileProcessor.js';
const debugLogger = createDebugLogger('COMMAND_FACTORY');
/**
 * Creates a SlashCommand from a parsed command definition.
 * This function is used by both TOML and Markdown command loaders.
 *
 * @param filePath The absolute path to the command file
 * @param baseDir The root command directory for name calculation
 * @param definition The parsed command definition (prompt and optional description)
 * @param extensionName Optional extension name to prefix commands with
 * @param fileExtension The file extension (e.g., '.toml' or '.md')
 * @returns A SlashCommand object
 */
export function createSlashCommandFromDefinition(filePath, baseDir, definition, extensionName, fileExtension) {
    const relativePathWithExt = path.relative(baseDir, filePath);
    const relativePath = relativePathWithExt.substring(0, relativePathWithExt.length - fileExtension.length);
    const baseCommandName = relativePath
        .split(path.sep)
        // Sanitize each path segment to prevent ambiguity. Since ':' is our
        // namespace separator, we replace any literal colons in filenames
        // with underscores to avoid naming conflicts.
        .map((segment) => segment.replaceAll(':', '_'))
        .join(':');
    // Add extension name tag for extension commands
    const defaultDescription = `Custom command from ${path.basename(filePath)}`;
    let description = definition.description || defaultDescription;
    if (extensionName) {
        description = `[${extensionName}] ${description}`;
    }
    const processors = [];
    const usesArgs = definition.prompt.includes(SHORTHAND_ARGS_PLACEHOLDER);
    const usesShellInjection = definition.prompt.includes(SHELL_INJECTION_TRIGGER);
    const usesAtFileInjection = definition.prompt.includes(AT_FILE_INJECTION_TRIGGER);
    // 1. @-File Injection (Security First).
    // This runs first to ensure we're not executing shell commands that
    // could dynamically generate malicious @-paths.
    if (usesAtFileInjection) {
        processors.push(new AtFileProcessor(baseCommandName));
    }
    // 2. Argument and Shell Injection.
    // This runs after file content has been safely injected.
    if (usesShellInjection || usesArgs) {
        processors.push(new ShellProcessor(baseCommandName));
    }
    // 3. Default Argument Handling.
    // Appends the raw invocation if no explicit {{args}} are used.
    if (!usesArgs) {
        processors.push(new DefaultArgumentProcessor());
    }
    return {
        name: baseCommandName,
        description,
        modelDescription: description,
        kind: CommandKind.FILE,
        extensionName,
        source: (extensionName
            ? 'plugin-command'
            : 'skill-dir-command'),
        sourceLabel: extensionName
            ? `${t('Extension:')} ${extensionName}`
            : t('Custom'),
        sourceDetail: extensionName ? 'extension' : 'custom',
        modelInvocable: definition.disableModelInvocation
            ? false
            : !extensionName || !!(definition.description || definition.whenToUse),
        argumentHint: definition.argumentHint,
        whenToUse: definition.whenToUse,
        action: async (context, _args) => {
            if (!context.invocation) {
                debugLogger.error(`[FileCommandLoader] Critical error: Command '${baseCommandName}' was executed without invocation context.`);
                return {
                    type: 'submit_prompt',
                    content: [{ text: definition.prompt }], // Fallback to unprocessed prompt
                };
            }
            try {
                let processedContent = [
                    { text: definition.prompt },
                ];
                for (const processor of processors) {
                    processedContent = await processor.process(processedContent, context);
                }
                return {
                    type: 'submit_prompt',
                    content: processedContent,
                };
            }
            catch (e) {
                // Check if it's our specific error type
                if (e instanceof ConfirmationRequiredError) {
                    // Halt and request confirmation from the UI layer.
                    return {
                        type: 'confirm_shell_commands',
                        commandsToConfirm: e.commandsToConfirm,
                        originalInvocation: {
                            raw: context.invocation.raw,
                        },
                    };
                }
                // Re-throw other errors to be handled by the global error handler.
                throw e;
            }
        },
    };
}
//# sourceMappingURL=command-factory.js.map