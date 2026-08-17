/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Extension } from '@qwen-code/qwen-code-core';
export declare const EXTENSION_REF_PREFIX = 'ext:';
export declare const EXTENSION_CONTEXT_BUDGET = 200000;
export declare const EXTENSION_CONTEXT_FILE_CAP = 50000;
/**
 * Parses an `ext:<name>` reference string. Returns the extension name
 * portion if the input starts with the extension prefix, or `null` otherwise.
 */
export declare function parseExtensionRef(pathName: string): {
  name: string;
} | null;
export declare function buildExtensionRef(extensionName: string): string;
export declare function matchExtensionByRef(
  name: string,
  extensions: Extension[],
): Extension | undefined;
export declare function sanitizeDisplayText(raw: string): string | null;
export declare function getExtensionDisplayName(extension: Extension): string;
export declare function buildExtensionContextText(extension: Extension): string;
export declare function buildExtensionMentionContext(
  extension: Extension,
  options: {
    remainingBudget: number;
    signal?: AbortSignal;
    onDebugMessage?: (message: string) => void;
  },
): Promise<{
  text: string;
  remainingBudget: number;
}>;
