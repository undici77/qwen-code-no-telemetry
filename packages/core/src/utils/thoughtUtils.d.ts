/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { GenerateContentResponse, Part } from '@google/genai';
export type ThoughtSummary = {
    subject: string;
    description: string;
};
export declare function createOpenAIReasoningThoughtPart(text: string): Part;
/**
 * @remarks The marker is stored on the original Part object and does not
 * survive cloning, spreading, or JSON serialization.
 */
export declare function isOpenAIReasoningThoughtPart(part: Part): boolean;
/**
 * Parses a raw thought string into a structured ThoughtSummary object.
 *
 * Thoughts are expected to have a bold "subject" part enclosed in double
 * asterisks (e.g., **Subject**). The rest of the string is considered
 * the description. This function only parses the first valid subject found.
 *
 * @param rawText The raw text of the thought.
 * @returns A ThoughtSummary object. If no valid subject is found, the entire
 * string is treated as the description.
 */
export declare function parseThought(rawText: string): ThoughtSummary;
export declare function getThoughtSummary(response: GenerateContentResponse): ThoughtSummary | null;
