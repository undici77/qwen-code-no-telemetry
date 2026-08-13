/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Config } from '@qwen-code/qwen-code-core';
import { type Suggestion } from '../utils/suggestions.js';
export { EXTENSION_REF_PREFIX, parseExtensionRef, buildExtensionRef, matchExtensionByRef, sanitizeDisplayText, buildExtensionContextText, } from '../../utils/extension-mention.js';
/**
 * Returns autocomplete suggestions for extensions matching the given pattern.
 * Unlike MCP server suggestions (which require a non-empty pattern to avoid
 * flooding), extensions show on bare `@` because their count is typically small.
 */
export declare function getExtensionSuggestions(config: Config | undefined, pattern: string): Suggestion[];
