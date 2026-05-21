/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export type TranslationValue = string | string[];
export type TranslationDict = Record<string, TranslationValue>;
export declare function getTranslationModuleExport(module: Record<string, unknown>): unknown;
export declare function isTranslationDict(value: unknown): value is TranslationDict;
