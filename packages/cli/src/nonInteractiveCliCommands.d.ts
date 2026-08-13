/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { PartListUnion } from '@google/genai';
import { type Config, type GoalStateCause, type GoalStateResponse } from '@qwen-code/qwen-code-core';
import { type GoalCommandOperation, type SlashCommand, type ExecutionMode } from './ui/commands/types.js';
import type { HistoryItemWithoutId } from './ui/types.js';
import type { LoadedSettings } from './config/settings.js';
/**
 * Result of handling a slash command in non-interactive mode.
 *
 * Supported types:
 * - 'submit_prompt': Submits content to the model (supports all modes)
 * - 'message': Returns a single message (supports non-interactive JSON/text only)
 * - 'stream_messages': Streams multiple messages (supports ACP only)
 * - 'goal_control': Returns the canonical Goal control result
 * - 'unsupported': Command cannot be executed in this mode
 * - 'no_command': No command was found or executed
 */
export type NonInteractiveSlashCommandResult = {
    type: 'submit_prompt';
    content: PartListUnion;
    outputHistoryItems?: HistoryItemWithoutId[];
    /** Per-turn model id (e.g. inline `/model <id> <prompt>`); no session change. */
    modelOverride?: string;
    refreshContextFilesOnWrite?: boolean;
} | {
    type: 'message';
    messageType: 'info' | 'warning' | 'error';
    content: string;
    outputHistoryItems?: HistoryItemWithoutId[];
} | {
    type: 'stream_messages';
    messages: AsyncGenerator<{
        messageType: 'info' | 'warning' | 'error';
        content: string;
    }, void, unknown>;
} | {
    type: 'goal_control';
    operation: GoalCommandOperation;
    response: GoalStateResponse;
    cause?: GoalStateCause;
} | {
    type: 'unsupported';
    reason: string;
    originalType: string;
} | {
    type: 'no_command';
};
/**
 * Processes a slash command in a non-interactive environment.
 *
 * @param rawQuery The raw query string (should start with '/')
 * @param abortController Controller to cancel the operation
 * @param config The configuration object
 * @param settings The loaded settings
 * @returns A Promise that resolves to a `NonInteractiveSlashCommandResult` describing
 *   the outcome of the command execution.
 */
/**
 * Session-scoped callbacks a caller can expose to the commands it runs.
 * Only the ACP host supplies these: it keeps one long-lived session object
 * across `/clear`, so commands that switch sessions have to be able to tell
 * it to re-attach.
 */
export interface NonInteractiveSlashCommandSessionHooks {
    /** @see CommandContext['session']['startNewSession'] */
    startNewSession?: (sessionId: string) => void;
}
export declare const handleSlashCommand: (rawQuery: string, abortController: AbortController, config: Config, settings: LoadedSettings, sessionHooks?: NonInteractiveSlashCommandSessionHooks) => Promise<NonInteractiveSlashCommandResult>;
/**
 * Retrieves all available slash commands for the given execution mode.
 *
 * @param config The configuration object
 * @param abortSignal Signal to cancel the loading process
 * @param mode The execution mode to filter commands for. Defaults to 'acp'.
 * @returns A Promise that resolves to an array of SlashCommand objects
 */
export declare const getAvailableCommands: (config: Config, abortSignal: AbortSignal, mode?: ExecutionMode, settings?: LoadedSettings) => Promise<SlashCommand[]>;
