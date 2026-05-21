/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { SlashCommand, ExecutionMode } from '../ui/commands/types.js';
import type { ICommandLoader } from './types.js';
/**
 * Orchestrates the discovery and loading of all slash commands for the CLI.
 *
 * This service operates on a provider-based loader pattern. It is initialized
 * with an array of `ICommandLoader` instances, each responsible for fetching
 * commands from a specific source (e.g., built-in code, local files).
 *
 * The CommandService is responsible for invoking these loaders, aggregating their
 * results, and resolving any name conflicts. This architecture allows the command
 * system to be extended with new sources without modifying the service itself.
 */
export declare class CommandService {
    private readonly commands;
    /**
     * Private constructor to enforce the use of the async factory.
     * @param commands A readonly array of the fully loaded and de-duplicated commands.
     */
    private constructor();
    /**
     * Asynchronously creates and initializes a new CommandService instance.
     *
     * This factory method orchestrates the entire command loading process. It
     * runs all provided loaders in parallel, aggregates their results, handles
     * name conflicts for extension commands by renaming them, and then returns a
     * fully constructed `CommandService` instance.
     *
     * Conflict resolution:
     * - Extension commands that conflict with existing commands are renamed to
     *   `extensionName.commandName`
     * - Non-extension commands (built-in, user, project) override earlier commands
     *   with the same name based on loader order
     *
     * @param loaders An array of objects that conform to the `ICommandLoader`
     *   interface. Built-in commands should come first, followed by FileCommandLoader.
     * @param signal An AbortSignal to cancel the loading process.
     * @param disabledNames Optional set of command names to exclude. Matched
     *   case-insensitively against the final (post-rename) command name. Intended
     *   for settings- or flag-driven denylists that gate the CLI surface (see
     *   `slashCommands.disabled` and `--disabled-slash-commands`).
     * @returns A promise that resolves to a new, fully initialized `CommandService` instance.
     */
    static create(loaders: ICommandLoader[], signal: AbortSignal, disabledNames?: ReadonlySet<string>): Promise<CommandService>;
    /**
     * Retrieves the currently loaded and de-duplicated list of slash commands.
     *
     * This method is a safe accessor for the service's state. It returns a
     * readonly array, preventing consumers from modifying the service's internal state.
     *
     * @returns A readonly, unified array of available `SlashCommand` objects.
     */
    getCommands(): readonly SlashCommand[];
    /**
     * Returns commands available in the specified execution mode.
     * Hidden commands are excluded.
     */
    getCommandsForMode(mode: ExecutionMode): readonly SlashCommand[];
    /**
     * Returns commands that the model is allowed to invoke (modelInvocable === true).
     * Hidden commands are excluded.
     */
    getModelInvocableCommands(): readonly SlashCommand[];
}
