/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { SlashCommand } from '../commands/types.js';
import type { RecentSlashCommands } from '../hooks/useSlashCompletion.js';
/**
 * Common Windows console code pages (CP) used for encoding conversions.
 *
 * @remarks
 * - `UTF8` (65001): Unicode (UTF-8) — recommended for cross-language scripts.
 * - `GBK` (936): Simplified Chinese — default on most Chinese Windows systems.
 * - `BIG5` (950): Traditional Chinese.
 * - `LATIN1` (1252): Western European — default on many Western systems.
 */
export declare const CodePage: {
    readonly UTF8: 65001;
    readonly GBK: 936;
    readonly BIG5: 950;
    readonly LATIN1: 1252;
};
export type CodePage = (typeof CodePage)[keyof typeof CodePage];
/**
 * Checks if a query string potentially represents an '@' command.
 * It triggers if the query starts with '@' or contains '@' preceded by whitespace
 * and followed by a non-whitespace character.
 *
 * @param query The input query string.
 * @returns True if the query looks like an '@' command, false otherwise.
 */
export declare const isAtCommand: (query: string) => boolean;
export declare const hasSlashCommandPathSeparator: (query: string) => boolean;
/**
 * Checks if a query string potentially represents an '/' command.
 * It triggers if the query starts with '/' but excludes code comments like '//'
 * and '/*', and file paths where the first token contains a path separator.
 *
 * @param query The input query string.
 * @returns True if the query looks like an '/' command, false otherwise.
 */
export declare const isSlashCommand: (query: string) => boolean;
/**
 * Checks if a query is a /btw side-question invocation.
 * Accepts both "/btw" and "?btw" prefixes.
 */
export declare const isBtwCommand: (query: string) => boolean;
export declare const copyToClipboard: (text: string) => Promise<void>;
export declare const getUrlOpenCommand: () => string;
/**
 * Represents a slash command token found mid-input (not at position 0).
 * e.g., in "hello /st", startPos=6, partialCommand="st"
 */
export type MidInputSlashCommand = {
    /** Full token including slash, e.g. "/st" */
    token: string;
    /** Position of the "/" in the full input string */
    startPos: number;
    /** Command portion without slash, e.g. "st" */
    partialCommand: string;
};
/**
 * Finds a slash command token that appears mid-input (not at position 0).
 * Only triggers when the "/" is preceded by whitespace and the cursor is
 * right at or within the partial command (no text between cursor and slash).
 *
 * Returns null when input starts with "/" (handled by start-of-line completion).
 */
export declare function findMidInputSlashCommand(input: string, cursorOffset: number): MidInputSlashCommand | null;
/**
 * Finds the best (alphabetically first) prefix-matching command for a partial
 * command string. Returns the completion suffix and full command name, or null.
 *
 * e.g. partialCommand="st" → { suffix: "ats", fullCommand: "stats" }
 */
export declare function getBestSlashCommandMatch(partialCommand: string, commands: readonly SlashCommand[], recentCommands?: RecentSlashCommands): {
    suffix: string;
    fullCommand: string;
    command: SlashCommand;
    argumentHint?: string;
} | null;
/**
 * Represents a slash command token found in input text (potentially mid-input).
 */
export type SlashCommandToken = {
    /** Start index (character position) of the token in the text */
    start: number;
    /** End index (exclusive) of the token in the text */
    end: number;
    /** The matched command name (without the leading slash) */
    commandName: string;
    /**
     * Whether the token corresponds to a known command.
     * Mid-input tokens are only valid when they match a model-invocable command.
     * Line-start tokens are valid for all interactive commands.
     */
    valid: boolean;
};
/**
 * Finds slash command tokens in input text and marks them as valid/invalid
 * based on the provided command list.
 *
 * - Tokens at position 0 are valid if they match any command.
 * - Mid-input tokens (preceded by whitespace) are valid only if they match a
 *   `modelInvocable` command, since built-in commands typed mid-text won't be
 *   executed.
 */
export declare function findSlashCommandTokens(text: string, commands: readonly SlashCommand[]): SlashCommandToken[];
