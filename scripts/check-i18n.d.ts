#!/usr/bin/env node
/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type { LanguageDefinition } from '../packages/cli/src/i18n/languages.js';
import { type TranslationDict } from '../packages/cli/src/i18n/translationDict.js';
export interface LocaleStats {
    code: string;
    id: string;
    totalKeys: number;
    translatedKeys: number;
    missingKeys: string[];
    extraKeys: string[];
    untranslatedMustKeys: string[];
}
export interface CheckResult {
    success: boolean;
    errors: string[];
    warnings: string[];
    stats: {
        totalKeys: number;
        unusedKeys: string[];
        unusedKeysOnlyInLocales?: string[];
        locales: LocaleStats[];
    };
}
export interface CheckI18nOptions {
    localesDir?: string;
    sourceDir?: string;
    supportedLanguages?: readonly Pick<LanguageDefinition, 'code' | 'id' | 'strictParity'>[];
    mustTranslateKeys?: readonly string[];
    strictKeyParityLocales?: ReadonlySet<string>;
}
export interface PrintCheckI18nOptions {
    writeUnusedKeysJson?: boolean;
    unusedKeysOutputPath?: string;
}
export declare function shouldWriteUnusedKeysJson(): boolean;
/**
 * Walk every translation value and report any value containing a forbidden
 * substring. Iterating over the parsed dict (rather than the raw file)
 * lets us report the offending key, and avoids matching characters inside
 * file-level comments or JS syntax.
 *
 * Only the longest matching pattern per value is reported, to keep CI output
 * focused on the most actionable fix.
 */
export declare function findForbiddenZhTwPatterns(translations: TranslationDict): Array<{
    key: string;
    pattern: string;
    preferred: string;
}>;
export declare function checkI18n(options?: CheckI18nOptions): Promise<CheckResult>;
export declare function printCheckI18nResult(result: CheckResult, options?: PrintCheckI18nOptions): void;
