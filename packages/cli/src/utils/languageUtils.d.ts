/**
 * @license
 * Copyright 2025 Qwen team
 * SPDX-License-Identifier: Apache-2.0
 */
/** Special value meaning "follow the user's input language" */
export declare const OUTPUT_LANGUAGE_AUTO = 'auto';
/**
 * Checks if a value represents the "auto" setting.
 */
export declare function isAutoLanguage(
  value: string | undefined | null,
): boolean;
/**
 * Normalizes a language input to its canonical form.
 * Converts known locale codes (e.g., "zh", "ru") to full names (e.g., "Chinese", "Russian").
 * Unknown inputs are returned as-is to support any language name.
 */
export declare function normalizeOutputLanguage(language: string): string;
/**
 * Resolves an explicit output language to its canonical form.
 */
export declare function resolveOutputLanguage(value: string): string;
/**
 * Preserves 'auto' as the dynamic same-language mode, otherwise resolves an
 * explicit language to its canonical form.
 */
export declare function resolveOutputLanguageOrPreserveAuto(
  value: string | undefined | null,
): string;
/**
 * Returns the path to the LLM output language rule file (~/.qwen/output-language.md).
 */
export declare function getOutputLanguageFilePath(): string;
/**
 * Writes the output language rule file with the given language.
 *
 * @param targetPath - When provided, write to this path instead of the
 *   global default.  Callers should pass `config.getOutputLanguageFilePath()`
 *   so the file that the session actually reads is the one being updated.
 */
export declare function writeOutputLanguageFile(
  language: string,
  targetPath?: string,
): void;
/**
 * Updates the LLM output language rule file based on the setting value.
 * Preserves 'auto' as a dynamic same-language rule, and resolves explicit
 * languages before writing.
 *
 * @param targetPath - Forwarded to {@link writeOutputLanguageFile}.
 */
export declare function updateOutputLanguageFile(
  settingValue: string,
  targetPath?: string,
): void;
/**
 * Writes the output-language file to the correct (config-bound) path and,
 * when no path was known yet (first-time creation), registers the global
 * default on the config so subsequent reads are consistent.
 *
 * This encapsulates the get-path → write → register-fallback sequence
 * that was previously duplicated across acpAgent, languageCommand, and
 * SettingsDialog.
 */
export declare function writeOutputLanguageAndRegisterPath(
  settingValue: string,
  config?: {
    getOutputLanguageFilePath(): string | undefined;
    setOutputLanguageFilePath(p: string): void;
  } | null,
): void;
/**
 * Initializes the LLM output language rule file on application startup.
 *
 * @param outputLanguage - The output language setting value (e.g., 'auto', 'Chinese', etc.)
 *
 * Behavior:
 * - If the rule file already exists and contains a valid language setting, do nothing (preserve user modifications)
 * - If the setting resolves to 'auto' but the rule file contains a generated fixed-language rule from the old auto behavior, migrate it to the same-language rule
 * - If the rule file doesn't exist, create it with the configured rule ('auto' -> same-language rule, explicit language -> fixed-language rule)
 */
export declare function initializeLlmOutputLanguage(
  outputLanguage?: string,
): void;
