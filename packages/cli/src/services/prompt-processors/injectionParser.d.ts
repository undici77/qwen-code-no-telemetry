/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Represents a single detected injection site in a prompt string.
 */
export interface Injection {
    /** The content extracted from within the braces (e.g., the command or path), trimmed. */
    content: string;
    /** The starting index of the injection (inclusive, points to the start of the trigger). */
    startIndex: number;
    /** The ending index of the injection (exclusive, points after the closing '}'). */
    endIndex: number;
}
/**
 * Iteratively parses a prompt string to extract injections (e.g., !{...} or @{...}),
 * correctly handling nested braces within the content.
 *
 * This parser relies on simple brace counting and does not support escaping.
 *
 * @param prompt The prompt string to parse.
 * @param trigger The opening trigger sequence (e.g., '!{', '@{').
 * @param contextName Optional context name (e.g., command name) for error messages.
 * @returns An array of extracted Injection objects.
 * @throws Error if an unclosed injection is found.
 */
export declare function extractInjections(prompt: string, trigger: string, contextName?: string): Injection[];
